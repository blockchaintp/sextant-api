'use strict'

const Promise = require('bluebird')
const async = require('async')
const tape = require('tape')
const database = require('../database')
const fixtures = require('../fixtures')

const asyncTest = require('../asyncTest')

const ClusterController = require('../../src/controller/cluster')
const Store = require('../../src/store')
const TaskProcessor = require('../../src/taskprocessor')
const Tasks = require('../../src/tasks')

const config = require('../../src/config')

const {
  CLUSTER_STATUS,
  PERMISSION_USER,
  TASK_ACTION,
  TASK_CONTROLLER_LOOP_DELAY,
} = config


database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return ClusterController({
      store,
    })
  }

  const getTaskProcessor = (handlers) => {
    const store = Store(getConnection())
    return TaskProcessor({
      store,
      handlers,
    })
  }

  let userMap = {}
  let testClusters = {}

  asyncTest('cluster task_handlers -> create users', async (t) => {
    userMap = await fixtures.insertTestUsers(getConnection())
  })

  asyncTest('cluster task_handlers -> create cluster', async (t) => {
  
    const store = Store(getConnection())

    const handlers = Tasks({
      testMode: true,
    })
    const controller = getController()
    const taskProcessor = getTaskProcessor(handlers)
    const testUser = userMap[PERMISSION_USER.admin]
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]

    await taskProcessor.start()

    const createTask = await controller.create({
      user: testUser,
      data: clusterData,
    })

    testClusters.admin = await store.cluster.get({
      id: createTask.resource_id,
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    const updatedCluster = await controller.get({
      id: testClusters.admin.id,
    })

    t.deepEqual(updatedCluster.desired_state, testClusters.admin.desired_state, `the applied_state has been updated to the desired_state`)
    t.equal(updatedCluster.status, CLUSTER_STATUS.provisioned, `the cluster status is provisioned`)

    await taskProcessor.stop()
  })

  asyncTest('cluster task_handlers -> create cluster error', async (t) => {
  
    const handlers = {
      [TASK_ACTION['cluster.create']]: function* errorClusterCreate(params) {
        throw new Error('test')
      }
    }
    const controller = getController()
    const taskProcessor = getTaskProcessor(handlers)
    const testUser = userMap[PERMISSION_USER.admin]
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]

    const insertData = Object.assign({}, clusterData, {
      name: 'error cluster',
    })

    await taskProcessor.start()

    const errorCluster = await controller.create({
      user: testUser,
      data: insertData,
    })

    await Promise.delay(TASK_CONTROLLER_LOOP_DELAY * 2)

    const updatedCluster = await controller.get({
      id: errorCluster.id,
      withTask: true,
    })

    
    t.equal(updatedCluster.status, CLUSTER_STATUS.error, `the cluster status is error`)
    t.equal(updatedCluster.task.error, `Error: test`, `the task error message is correct`)

    await taskProcessor.stop()
  })

  /*
  asyncTest('cluster controller -> update cluster', async (t) => {
  
    const controller = getController()
    const taskProcessor = getTaskProcessor({})
    const testUser = userMap[PERMISSION_USER.admin]
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]

    const NEW_NAME = 'new name'
    const NEW_API_SERVER = 'http://otherapi.com'

    async.series([

      next => taskProcessor.start(next),

      next => controller.update({
        user: testUser,
        id: testClusters.admin.id,
        data: {
          name: NEW_NAME,
          desired_state: {
            apiServer: NEW_API_SERVER,
          }
        },
      }, next),

      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),

      next => controller.get({
        id: testClusters.admin.id,
      }, (err, cluster) => {
        if(err) return next(err)

        t.deepEqual(cluster.desired_state, cluster.applied_state, `the applied_state has been updated to the desired_state`)

        t.equal(cluster.name, NEW_NAME, `the name has been updated`)
        t.equal(cluster.desired_state.apiServer, NEW_API_SERVER, `the apiServer has been updated`)
        t.equal(cluster.desired_state.ca_id, testClusters.admin.desired_state.ca_id, `the ca is the same as before`)
        t.equal(cluster.desired_state.token_id, testClusters.admin.desired_state.token_id, `the token is the same as before`)

        next()
      }),
    ], (err) => {
      t.notok(err, `there was no error`)
      taskProcessor.stop(() => {
        t.end()
      })
    })

  })

  asyncTest('cluster controller -> delete cluster', async (t) => {
  
    const controller = getController()
    const taskProcessor = getTaskProcessor({})
    const testUser = userMap[PERMISSION_USER.admin]
    
    async.series([

      next => taskProcessor.start(next),

      next => controller.delete({
        user: testUser,
        id: testClusters.admin.id,
      }, next),

      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),

      next => controller.list({
        user: testUser,
      }, (err, clusters) => {
        if(err) return next(err)

        t.equal(clusters.length, 0, `there are no clusters in the list`)

        next()
      }),
    ], (err) => {
      t.notok(err, `there was no error`)
      taskProcessor.stop(() => {
        t.end()
      })
    })

  })
*/
  
})