/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable object-shorthand */
/* eslint-disable no-shadow */
const bluebird = require('bluebird')
const asyncTest = require('./asyncTest')
const { Store } = require('../src/store')
const { TaskProcessor } = require('../src/tasks/taskprocessor')
const config = require('../src/config')

const database = require('./database')
const fixtures = require('./fixtures')

const { USER_TYPES, RESOURCE_TYPES, TASK_ACTION, TASK_STATUS, TABLES, CLUSTER_PROVISION_TYPE } = config

database.testSuiteWithDatabase((getConnection) => {
  let userMap = {}

  asyncTest('task store -> create users', async () => {
    const users = await fixtures.insertTestUsers(getConnection())
    userMap = users
  })

  const getTaskFixture = () => ({
    user: userMap[USER_TYPES.superuser].id,
    resource_type: RESOURCE_TYPES.cluster,
    resource_id: 10,
    restartable: true,
    action: TASK_ACTION['cluster.create'],
    payload: {
      apples: 10,
    },
    resource_status: {
      completed: 'provisioned',
      error: 'error',
    },
  })

  const getCompareTask = (task) => ({
    user: task.user,
    resource_type: task.resource_type,
    resource_id: task.resource_id,
    restartable: task.restartable,
    action: task.action,
    payload: task.payload,
    resource_status: task.resource_status,
  })

  let store = null

  // clean up all tasks from the database after each test
  const cleanUp = () => store.knex(TABLES.task).del().returning('*')

  const runTaskProcessor = async ({ store, taskData, handlers }) => {
    const taskProcessor = TaskProcessor({
      store,
      handlers,
    })

    await taskProcessor.start()

    const createdTask = await store.task.create({
      data: taskData,
    })

    await new bluebird((resolve) => taskProcessor.emitter.on('task.processed', resolve))

    await taskProcessor.stop()

    return createdTask
  }

  asyncTest('make store', () => {
    store = new Store(getConnection())
  })

  asyncTest('task processor -> create cluster task', async (t) => {
    const taskData = getTaskFixture()

    let handlerParams = null

    const handlers = {
      [TASK_ACTION['cluster.create']]: function* (params) {
        handlerParams = params
        yield undefined
      },
    }

    const createdTask = await runTaskProcessor({
      store,
      taskData,
      handlers,
    })

    t.ok(handlerParams.store, 'the store was passed to the task handler')
    t.deepEqual(getCompareTask(handlerParams.task), taskData, 'the task data is correct')
    t.equal(handlerParams.task.status, TASK_STATUS.running, 'the task is in running status')
    t.equal(handlerParams.task.id, createdTask.id, 'the created task id is the same')
  })

  asyncTest(
    'task processor -> error task handler',
    async (t) => {
      const ERROR_TEXT = 'this is a test error'

      const taskData = getTaskFixture()

      const handlers = {
        [TASK_ACTION['cluster.create']]: function* () {
          yield bluebird.delay(1000)
          throw new Error(ERROR_TEXT)
        },
      }

      const createdTask = await runTaskProcessor({
        store,
        taskData,
        handlers,
      })

      const finalTask = await store.task.get({
        id: createdTask.id,
      })

      t.equal(finalTask.status, TASK_STATUS.error, 'the task was errored')
      t.equal(finalTask.error, `Error: ${ERROR_TEXT}`, 'the error message was correct')
    },
    cleanUp
  )

  asyncTest(
    'cancel a task halfway through',
    async (t) => {
      const taskData = getTaskFixture()

      let sawStep = false

      const handlers = {
        [TASK_ACTION['cluster.create']]: function* (params) {
          yield store.task.update({
            id: params.task.id,
            data: {
              status: TASK_STATUS.cancelling,
            },
          })
          yield bluebird.resolve(true)
          sawStep = true
        },
      }

      const createdTask = await runTaskProcessor({
        store,
        taskData,
        handlers,
      })

      const finalTask = await store.task.get({
        id: createdTask.id,
      })

      t.equal(sawStep, false, 'we never got to the step after the cancel')
      t.equal(finalTask.status, TASK_STATUS.cancelled, 'the task was cancelled')
    },
    cleanUp
  )

  asyncTest(
    'check the transaction rollback is working',
    async (t) => {
      const taskData = getTaskFixture()

      const ORIGINAL_NAME = 'testcluster'
      const NEW_NAME = 'new name'
      const ERROR_TEXT = 'test error'

      const cluster = await store.cluster.create({
        data: {
          name: ORIGINAL_NAME,
          provision_type: CLUSTER_PROVISION_TYPE.local,
          desired_state: {
            apples: 10,
          },
          capabilities: {
            funkyFeature: true,
          },
        },
      })

      let updatedCluster = null

      const handlers = {
        [TASK_ACTION['cluster.create']]: function* (params) {
          const { trx } = params

          yield store.cluster.update(
            {
              id: cluster.id,
              data: {
                name: NEW_NAME,
              },
            },
            trx
          )

          updatedCluster = yield store.cluster.get(
            {
              id: cluster.id,
            },
            trx
          )

          throw new Error(ERROR_TEXT)
        },
      }

      const createdTask = await runTaskProcessor({
        store,
        taskData,
        handlers,
      })

      const finalTask = await store.task.get({
        id: createdTask.id,
      })

      const finalCluster = await store.cluster.get({
        id: cluster.id,
      })

      t.equal(updatedCluster.name, NEW_NAME, 'the name was updated inside the handler')
      t.equal(finalCluster.name, ORIGINAL_NAME, 'the name was rolled back with the transaction')
      t.equal(finalTask.status, TASK_STATUS.error, 'the task was errored')
      t.equal(finalTask.error, `Error: ${ERROR_TEXT}`, 'the error message was correct')
    },
    cleanUp
  )
})
