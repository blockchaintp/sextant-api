'use strict'

const async = require('async')
const tape = require('tape')
const database = require('../database')
const fixtures = require('../fixtures')

const ClusterController = require('../../src/controller/cluster')
const Store = require('../../src/store')
const TaskProcessor = require('../taskProcessor')
const Tasks = require('../../src/tasks')

const config = require('../../src/config')

const {
  CLUSTER_STATUS,
  PERMISSION_USER,
  TASK_CONTROLLER_LOOP_DELAY,
} = config


database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return ClusterController({
      store,
    })
  }

  const getTaskProcessor = (opts, done) => {
    const handlers = Tasks(opts)
    const store = Store(getConnection())
    return TaskProcessor({
      store,
      handlers,
    })
  }

  let userMap = {}
  let testClusters = {}

  tape('cluster task_handlers -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
  
  })

  tape('cluster controller -> create cluster', (t) => {
  
    const controller = getController()
    const taskProcessor = getTaskProcessor({})
    const testUser = userMap[PERMISSION_USER.admin]
    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[1]

    async.series([

      next => taskProcessor.start(next),

      next => controller.create({
        user: testUser,
        data: clusterData,
      }, (err, cluster) => {
        if(err) return next(err)
        testClusters.admin = cluster
        next()
      }),

      next => setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2),

      next => controller.get({
        id: testClusters.admin.id,
      }, (err, cluster) => {
        if(err) return next(err)
        t.deepEqual(cluster.desired_state, cluster.applied_state, `the applied_state has been updated to the desired_state`)
        t.equal(cluster.status, CLUSTER_STATUS.provisioned, `the cluster status is provisioned`)
        next()
      }),
    ], (err) => {
      t.notok(err, `there was no error`)
      taskProcessor.stop(() => {
        t.end()
      })
    })

  })

  tape('cluster controller -> update cluster', (t) => {
  
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

  tape('cluster controller -> delete cluster', (t) => {
  
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

  
})