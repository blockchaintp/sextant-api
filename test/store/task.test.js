'use strict'

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')
const asyncTest = require('../asyncTest')

const TaskStore = require('../../src/store/task')
const config = require('../../src/config')

const {
  RESOURCE_TYPES,
  PERMISSION_USER,
  TASK_STATUS,
} = config

database.testSuiteWithDatabase(getConnection => {

  let taskMap = {}
  let userMap = {}

  asyncTest('task store -> create users', async (t) => {
    const users = await fixtures.insertTestUsers(getConnection())
    userMap = users
  })

  asyncTest('task store -> list no data', async (t) => {
    const store = TaskStore(getConnection())
    const tasks = await store.list({})
    t.equal(tasks.length, 0, `there were no tasks`)
  })

  asyncTest('task store -> create with missing values', async (t) => {

    const store = TaskStore(getConnection())

    await tools.insertWithMissingValues(t, store, {
      user: userMap[PERMISSION_USER.admin].id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
      restartable: true,
      payload: {
        apples: 10,
      },
    })
  })

  asyncTest('task store -> create tasks for admin user', async (t) => {
    const tasks = await fixtures.insertTestTasks(getConnection(), userMap[PERMISSION_USER.admin].id)
    taskMap = tasks
  })

  asyncTest('task store -> create tasks for write user', async (t) => {
    const insertData = fixtures.SIMPLE_TASK_DATA.map(task => {
      return Object.assign({}, task, {
        resource_id: task.resource_id + 10,
      })
    })
    const tasks = await fixtures.insertTestTasks(getConnection(), userMap[PERMISSION_USER.user].id, insertData)
    Object.keys(tasks).forEach(key => {
      taskMap[key] = tasks[key]
    })
  })

  asyncTest('task store -> list all', async (t) => {

    const store = TaskStore(getConnection())

    // we inserted each set of tasks for 2 users
    const expectedCount = fixtures.SIMPLE_TASK_DATA.length * 2

    const tasks = await store.list({})
    t.equal(tasks.length, expectedCount, `there were ${expectedCount} tasks`)
  })


  asyncTest('task store -> list by cluster', async (t) => {

    const store = TaskStore(getConnection())

    const tasks = await store.list({
      cluster: 10,
    })
    t.equal(tasks.length, 1, `there was 1 task`)
    t.equal(tasks[0].resource_type, RESOURCE_TYPES.cluster, `the resource_type is correct`)
    t.equal(tasks[0].resource_id, 10, `the resource_id is correct`)
  })
  
  asyncTest('task store -> list by deployment', async (t) => {

    const store = TaskStore(getConnection())

    const tasks = await store.list({
      deployment: 11,
    })
    t.equal(tasks.length, 1, `there was 1 task`)
    t.equal(tasks[0].resource_type, RESOURCE_TYPES.deployment, `the resource_type is correct`)
    t.equal(tasks[0].resource_id, 11, `the resource_id is correct`)
  })

  asyncTest('task store -> list by user', async (t) => {

    const store = TaskStore(getConnection())

    const expectedCount = fixtures.SIMPLE_TASK_DATA.length
    const userId = userMap[PERMISSION_USER.admin].id

    const tasks = await store.list({
      user: userId,
    })
    t.equal(tasks.length, expectedCount, `there were ${expectedCount} tasks`)
    t.deepEqual(tasks.map(task => task.user), [userId, userId], `the user ids are correct`)
  })


  asyncTest('task store -> get', async (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    const task = await store.get({
      id: ids[0],
    })
    t.deepEqual(task, taskMap[ids[0]], `the returned task is correct`)
  })

  asyncTest('task store -> update bad status', async (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    let error = null

    try {
      await store.update({
        id: ids[0],
        data: {
          status: 'apples'
        }
      })
    }
    catch(err) {
      error = err
    }

    t.ok(error, `there was an error`)
  })

  asyncTest('task store -> update status', async (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap)

    await store.update({
      id: ids[0],
      data: {
        status: TASK_STATUS.running,
      }
    })

    const task = await store.get({
      id: ids[0],
    })
    t.equal(task.status, TASK_STATUS.running, `the updated status is ok`)
  })

  asyncTest('task store -> activeForResource', async (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap).map(i => parseInt(i))

    const tasks = await store.activeForResource({
      cluster: 10,
    })

    t.equal(tasks.length, 1, `there was 1 task`)
    t.deepEqual(tasks.map(task => task.resource_type), [RESOURCE_TYPES.cluster], `the resource_types are correct`)
    t.deepEqual(tasks.map(task => task.id), [ids[0]], `the resource_ids are correct`)
    t.deepEqual(tasks.map(task => task.resource_id), [10], `the resource_ids are correct`)
  })

  asyncTest('task store -> load with status', async (t) => {

    const store = TaskStore(getConnection())

    const ids = Object.keys(taskMap).map(i => parseInt(i))

    const tasks = await store.list({
      status: TASK_STATUS.running,
    })

    t.equal(tasks.length, 1, `there was 1 task`)
  })

})