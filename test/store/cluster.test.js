'use strict'

const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const ClusterStore = require('../../src/store/cluster')
const config = require('../../src/config')

const {
  CLUSTER_STATUS,
  CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS_DEFAULT,
} = config

database.testSuiteWithDatabase(getConnection => {
  let testCluster = null
  let clusterMap = {}

  tape('cluster store -> list no data', (t) => {

    const store = ClusterStore(getConnection())
  
    store.list({}, tools.errorWrapper(t, (clusters) => {
      t.equal(clusters.length, 0, `there were no clusters`)
      t.end()
    }))
    
  })

  tape('cluster store -> create with missing values', (t) => {

    const store = ClusterStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      name: 'testcluster',
      provision_type: CLUSTER_PROVISION_TYPE.aws_ec2,
      desired_state: {
        apples: 10,
      },
    })
  })

  tape('cluster store -> create with bad provision_type', (t) => {
  
    const store = ClusterStore(getConnection())
  
    store.create({
      data: {
        name: 'testcluster',
        provision_type: 'silly_provision_type',
        desired_state: {
          apples: 10,
        },
      }
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })  
  })

  tape('cluster store -> create clusters', (t) => {

    const compareCluster = fixtures.SIMPLE_CLUSTER_DATA[0]

    fixtures.insertTestClusters(getConnection(), tools.errorWrapper(t, (clusters) => {
      testCluster = clusters[compareCluster.name]

      t.deepEqual(testCluster.applied_state, {}, `the applied_state defaults to empty object`)
      t.deepEqual(testCluster.desired_state, compareCluster.desired_state, `the desired_state is correct`)
      t.equal(testCluster.name, compareCluster.name, `the name is correct`)
      t.equal(testCluster.provision_type, compareCluster.provision_type, `the provision_type is correct`)
      t.equal(testCluster.status, CLUSTER_STATUS_DEFAULT, `the state defaults to created`)
      t.equal(testCluster.maintenance_flag, false, `the maintenance_flag defaults to false`)
      clusterMap = clusters
      t.end()
    }))
  
  })

  tape('cluster store -> list with ordered data', (t) => {
  
    const store = ClusterStore(getConnection())

    const expectedCount = fixtures.SIMPLE_CLUSTER_DATA.length
    const expectedOrder = fixtures.SIMPLE_CLUSTER_DATA.map(d => d.name)

    expectedOrder.sort()
  
    store.list({}, tools.errorWrapper(t, (clusters) => {
      t.equal(clusters.length, expectedCount, `there were ${expectedCount} clusters`)
      t.deepEqual(clusters.map(cluster => cluster.name), expectedOrder, 'the clusters were in the correct order')
      t.end()
    }))
    
  })

  tape('cluster store -> get', (t) => {
  
    const store = ClusterStore(getConnection())

    store.get({
      id: testCluster.id,
    }, tools.errorWrapper(t, (cluster) => {
      t.deepEqual(cluster, testCluster, 'the returned cluster is correct')
      t.end()
    }))
    
  })

  tape('cluster store -> update with bad status', (t) => {
  
    const store = ClusterStore(getConnection())

    store.update({
      id: testCluster.id,
      data: {
        status: 'oranges',
      }
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('cluster store -> update', (t) => {
  
    const store = ClusterStore(getConnection())

    store.update({
      id: testCluster.id,
      data: {
        status: CLUSTER_STATUS.provisioned,
      }
    }, tools.errorWrapper(t, (firstCluster) => {
      t.equal(firstCluster.status, CLUSTER_STATUS.provisioned, `the new status is correct`)
      store.get({
        id: testCluster.id,
      }, tools.errorWrapper(t, (secondCluster) => {
        t.equal(secondCluster.status, CLUSTER_STATUS.provisioned, `querying on the updated cluster is working`)
        t.end()
      }))
    }))
    
  })

  tape('cluster store -> delete', (t) => {
  
    const store = ClusterStore(getConnection())

    store.delete({
      id: testCluster.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      store.list({}, tools.errorWrapper(t, (clusters) => {
        t.equal(clusters.length, fixtures.SIMPLE_CLUSTER_DATA.length-1, `there is 1 less cluster`)
        t.end()
      }))
    })
    
  })

  tape('cluster store -> list with deleted', (t) => {
  
    const store = ClusterStore(getConnection())

    const expectedCount = fixtures.SIMPLE_CLUSTER_DATA.length
  
    store.list({
      deleted: true,
    }, tools.errorWrapper(t, (clusters) => {
      t.equal(clusters.length, expectedCount, `there are ${expectedCount} clusters`)
      t.end()
    }))
    
  })

})