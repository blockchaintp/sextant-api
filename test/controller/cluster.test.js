'use strict'

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

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]

    controller.create({
      user: userMap.write,
      data: clusterData,
    }, (err, cluster) => {
      t.notok(err, `there was no error`)
      t.equal(cluster.name, clusterData.name, `the cluster name is correct`)
      t.deepEqual(cluster.desired_state, clusterData.desired_state, `the cluster desired_state is correct`)
      testCluster = cluster
      console.log('--------------------------------------------')
      console.dir(cluster)
      t.end()
    })
    
  
  })
  
})