'use strict'

const tape = require('tape')
const async = require('async')

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const DeploymentStore = require('../../src/store/deployment')
const config = require('../../src/config')

const {
  DEPLOYMENT_STATUS,
  DEPLOYMENT_STATUS_DEFAULT,
} = config

database.testSuiteWithDatabase(getConnection => {

  let testCluster = null
  let testDeployment = null
  let deploymentMap = {}

  tape('deployment store -> create clusters', (t) => {

    fixtures.insertTestClusters(getConnection(), (err, clusters) => {
      t.notok(err, `there was no error`)
      testCluster = clusters[fixtures.SIMPLE_CLUSTER_DATA[0].name]
      t.end()
    })
  
  })

  tape('deployment store -> list with no cluster id', (t) => {

    const store = DeploymentStore(getConnection())
  
    store.list({}, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('deployment store -> list no data', (t) => {

    const store = DeploymentStore(getConnection())
  
    store.list({
      cluster: testCluster.id,
    }, (err, deployments) => {
      t.notok(err, `there was no error`)
      t.equal(deployments.length, 0, `there were no deployments`)
      t.end()
    })
    
  })

  tape('deployment store -> create with missing values', (t) => {

    const store = DeploymentStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      name: 'testdeployment',
      cluster: testCluster.id,
      desired_state: {
        apples: 10,
      },
    })
  })

  tape('deployment store -> create deployments', (t) => {

    const compareDeployment = fixtures.SIMPLE_DEPLOYMENT_DATA[0]

    fixtures.insertTestDeployments(getConnection(), testCluster.id, (err, deployments) => {
      t.notok(err, `there was no error`)

      testDeployment = deployments[compareDeployment.name]
      t.equal(testDeployment.cluster, testCluster.id, `the cluster is the correct id`)
      t.deepEqual(testDeployment.applied_state, {}, `the applied_state defaults to empty object`)
      t.deepEqual(testDeployment.desired_state, compareDeployment.desired_state, `the desired_state is correct`)
      t.equal(testDeployment.name, compareDeployment.name, `the name is correct`)
      t.equal(testDeployment.status, DEPLOYMENT_STATUS_DEFAULT, `the state defaults to created`)
      t.equal(testDeployment.maintenance_flag, false, `the maintenance_flag defaults to false`)
      deploymentMap = deployments
      t.end()
    })
  
  })

  tape('deployment store -> list with ordered data', (t) => {
  
    const store = DeploymentStore(getConnection())

    const expectedCount = fixtures.SIMPLE_DEPLOYMENT_DATA.length
    const expectedOrder = fixtures.SIMPLE_DEPLOYMENT_DATA.map(d => d.name)

    expectedOrder.sort()
  
    store.list({
      cluster: testCluster.id,
    }, (err, deployments) => {
      t.notok(err, `there was no error`)
      t.equal(deployments.length, expectedCount, `there were ${expectedCount} deployments`)
      t.deepEqual(deployments.map(deployment => deployment.name), expectedOrder, 'the deployments were in the correct order')
      t.end()
    })
    
  })

  tape('deployment store -> get', (t) => {
  
    const store = DeploymentStore(getConnection())

    store.get({
      id: testDeployment.id,
    }, (err, deployment) => {
      t.notok(err, `there was no error`)
      t.deepEqual(deployment, testDeployment, 'the returned deployment is correct')
      t.end()
    })
    
  })

  tape('deployment store -> update with bad status', (t) => {
  
    const store = DeploymentStore(getConnection())

    store.update({
      id: testDeployment.id,
      data: {
        status: 'oranges',
      }
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('deployment store -> update', (t) => {
  
    const store = DeploymentStore(getConnection())

    store.update({
      id: testDeployment.id,
      data: {
        status: DEPLOYMENT_STATUS.provisioned,
      }
    }, (err, firstDeployment) => {
      t.notok(err, `there was no error`)
      t.equal(firstDeployment.status, DEPLOYMENT_STATUS.provisioned, `the new status is correct`)
      store.get({
        id: testDeployment.id,
      }, (err, secondDeployment) => {
        t.notok(err, `there was no error`)
        t.equal(secondDeployment.status, DEPLOYMENT_STATUS.provisioned, `querying on the updated cluster is working`)
        t.end()
      })
    })
    
  })

  tape('deployment store -> delete', (t) => {
  
    const store = DeploymentStore(getConnection())

    store.delete({
      id: testDeployment.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      store.list({
        cluster: testCluster.id,
      },(err, deployments) => {
        t.notok(err, `there was no error`)
        t.equal(deployments.length, fixtures.SIMPLE_DEPLOYMENT_DATA.length-1, `there is 1 less deployment`)
        t.end()
      })
    })
    
  })

})