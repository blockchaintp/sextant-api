'use strict'

const tape = require('tape')
const async = require('async')

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const DeploymentStore = require('../../src/store/deployment')
const enumerations = require('../../src/enumerations')

database.testSuiteWithDatabase(getConnection => {

  let testCluster = null
  let deploymentMap = {}

  tape('deployment store -> create clusters', (t) => {

    fixtures.insertTestClusters(getConnection(), (err, clusters) => {
      t.notok(err, `there was no error`)
      testCluster = clusters.testcluster
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

  tape('deployment store -> insert with missing values', (t) => {

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

    const compareDeployment = fixtures.SIMPLE_DEPLOYMENT_DATA.filter(deployment => deployment.name == 'testdeployment')[0]

    fixtures.insertTestDeployments(getConnection(), testCluster.id, (err, deployments) => {
      t.notok(err, `there was no error`)
      t.equal(deployments.testdeployment.cluster, testCluster.id, `the cluster is the correct id`)
      t.deepEqual(deployments.testdeployment.applied_state, {}, `the applied_state defaults to empty object`)
      t.deepEqual(deployments.testdeployment.desired_state, compareDeployment.desired_state, `the desired_state is correct`)
      t.equal(deployments.testdeployment.name, compareDeployment.name, `the name is correct`)
      t.equal(deployments.testdeployment.status, enumerations.DEPLOYMENT_STATUS_DEFAULT, `the state defaults to created`)
      t.equal(deployments.testdeployment.maintenance_flag, false, `the maintenance_flag defaults to false`)
      deploymentMap = deployments
      t.end()
    })
  
  })

  tape('deployment store -> list with ordered data', (t) => {
  
    const store = DeploymentStore(getConnection())
  
    store.list({
      cluster: testCluster.id,
    }, (err, deployments) => {
      t.notok(err, `there was no error`)
      t.equal(deployments.length, 2, `there were 2 deployments`)
      t.deepEqual(deployments.map(deployment => deployment.name), [
        'otherdeployment',
        'testdeployment',
      ], 'the deployments were in the correct order')
      t.end()
    })
    
  })

  tape('deployment store -> get', (t) => {
  
    const store = DeploymentStore(getConnection())

    const testdeployment = deploymentMap.testdeployment
  
    store.get({
      id: testdeployment.id,
    }, (err, deployment) => {
      t.notok(err, `there was no error`)
      t.deepEqual(deployment, testdeployment, 'the returned deployment is correct')
      t.end()
    })
    
  })

  tape('deployment store -> update with bad status', (t) => {
  
    const store = DeploymentStore(getConnection())

    const testdeployment = deploymentMap.testdeployment
  
    store.update({
      id: testdeployment.id,
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

    const testdeployment = deploymentMap.testdeployment
  
    store.update({
      id: testdeployment.id,
      data: {
        status: 'provisioned',
      }
    }, (err, firstDeployment) => {
      t.notok(err, `there was no error`)
      t.equal(firstDeployment.status, 'provisioned', `the new status is correct`)
      store.get({
        id: testdeployment.id,
      }, (err, secondDeployment) => {
        t.notok(err, `there was no error`)
        t.equal(secondDeployment.status, 'provisioned', `querying on the updated cluster is working`)
        t.end()
      })
    })
    
  })

  tape('deployment store -> delete', (t) => {
  
    const store = DeploymentStore(getConnection())
  
    const testdeployment = deploymentMap.testdeployment

    store.delete({
      id: testdeployment.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      store.list({
        cluster: testCluster.id,
      },(err, deployments) => {
        t.notok(err, `there was no error`)
        t.equal(deployments.length, 1, `there is 1 deployment`)
        t.equal(deployments[0].name, 'otherdeployment', 'the remaining deployment is correct')
        t.end()
      })
    })
    
  })


})