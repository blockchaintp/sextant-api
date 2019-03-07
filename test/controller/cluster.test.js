'use strict'

const async = require('async')
const tape = require('tape')
const database = require('../database')
const fixtures = require('../fixtures')
const ClusterController = require('../../src/controller/cluster')
const Store = require('../../src/store')

database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return ClusterController({
      store,
    })
  }

  let userMap = {}
  let testCluster = null

  tape('cluster controller -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
  
  })

  tape('cluster controller -> create cluster', (t) => {
  
    const controller = getController()
    const store = Store(getConnection())

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]

    async.series([

      // insert the cluster
      next => {
        controller.create({
          user: userMap.write,
          data: clusterData,
        }, (err, cluster) => {
          if(err) return next(err)
          t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
          t.deepEqual(cluster.desired_state, clusterData.desired_state, `the cluster desired_state is correct`)
          testCluster = cluster
          next()
        })
      },

      // check we have a user writable role for the cluster
      next => {
        store.role.get({
          user: userMap.write.id,
          resource_type: 'cluster',
          resource_id: testCluster.id
        }, (err, role) => {
          if(err) return next(err)
          t.equal(role.user, userMap.write.id, `the role user id is correct`)
          t.equal(role.resource_type, 'cluster', `the role resource_type is correct`)
          t.equal(role.resource_id, testCluster.id, `the role resource_id is correct`)
          next()
        })
      },

      // check we have a task for the cluster.create
      next => {
        store.task.list({
          resource_type: 'cluster',
          resource_id: testCluster.id
        }, (err, tasks) => {
          if(err) return next(err)
          t.equal(tasks.length,1, `there is a create task`)
          const task = tasks[0]
          t.equal(task.user, userMap.write.id, `the task resource_type is correct`)
          t.equal(task.resource_type, 'cluster', `the task resource_type is correct`)
          t.equal(task.resource_id, testCluster.id, `the task resource_id is correct`)
          t.equal(task.status, 'created', `the task status is correct`)
          t.equal(task.restartable, true, `the task restartable is correct`)
          t.deepEqual(task.payload, {
            type: 'cluster.create',
            clusterid: testCluster.id,
            provision_type: testCluster.provision_type,
            desired_state: testCluster.desired_state,
            capabilities: testCluster.capabilities,
          }, 'the task payload is correct')
          next()
        })
      },

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('cluster controller -> cannot update a cluster with a running task', (t) => {
    
  })
  
})