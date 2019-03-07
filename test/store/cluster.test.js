'use strict'

const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const ClusterStore = require('../../src/store/cluster')
const enumerations = require('../../src/enumerations')

database.testSuiteWithDatabase(getConnection => {

  let clusterMap = {}

  tape('cluster store -> list no data', (t) => {

    const store = ClusterStore(getConnection())
  
    store.list({}, (err, clusters) => {
      t.notok(err, `there was no error`)
      t.equal(clusters.length, 0, `there were no clusters`)
      t.end()
    })
    
  })

  tape('cluster store -> create with missing values', (t) => {

    const store = ClusterStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      name: 'testcluster',
      provision_type: 'aws_ec2',
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

    const compareCluster = fixtures.SIMPLE_CLUSTER_DATA.filter(cluster => cluster.name == 'testcluster')[0]

    fixtures.insertTestClusters(getConnection(), (err, clusters) => {
      t.notok(err, `there was no error`)
      t.deepEqual(clusters.testcluster.applied_state, {}, `the applied_state defaults to empty object`)
      t.deepEqual(clusters.testcluster.desired_state, compareCluster.desired_state, `the desired_state is correct`)
      t.equal(clusters.testcluster.name, compareCluster.name, `the name is correct`)
      t.equal(clusters.testcluster.provision_type, compareCluster.provision_type, `the provision_type is correct`)
      t.equal(clusters.testcluster.status, enumerations.CLUSTER_STATUS_DEFAULT, `the state defaults to created`)
      t.equal(clusters.testcluster.maintenance_flag, false, `the maintenance_flag defaults to false`)
      clusterMap = clusters
      t.end()
    })
  
  })

  tape('cluster store -> list with ordered data', (t) => {
  
    const store = ClusterStore(getConnection())
  
    store.list({}, (err, clusters) => {
      t.notok(err, `there was no error`)
      t.equal(clusters.length, 2, `there were 2 clusters`)
      t.deepEqual(clusters.map(cluster => cluster.name), [
        'othercluster',
        'testcluster',
      ], 'the clusters were in the correct order')
      t.end()
    })
    
  })

  tape('cluster store -> get', (t) => {
  
    const store = ClusterStore(getConnection())

    const testcluster = clusterMap.testcluster
  
    store.get({
      id: testcluster.id,
    }, (err, cluster) => {
      t.notok(err, `there was no error`)
      t.deepEqual(cluster, testcluster, 'the returned cluster is correct')
      t.end()
    })
    
  })


  tape('cluster store -> update with bad status', (t) => {
  
    const store = ClusterStore(getConnection())

    const testcluster = clusterMap.testcluster
  
    store.update({
      id: testcluster.id,
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

    const testcluster = clusterMap.testcluster
  
    store.update({
      id: testcluster.id,
      data: {
        status: 'provisioned',
      }
    }, (err, firstCluster) => {
      t.notok(err, `there was no error`)
      t.equal(firstCluster.status, 'provisioned', `the new status is correct`)
      store.get({
        id: testcluster.id,
      }, (err, secondCluster) => {
        t.notok(err, `there was no error`)
        t.equal(secondCluster.status, 'provisioned', `querying on the updated cluster is working`)
        t.end()
      })
    })
    
  })

  tape('cluster store -> delete', (t) => {
  
    const store = ClusterStore(getConnection())
  
    const testcluster = clusterMap.testcluster

    store.delete({
      id: testcluster.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      store.list({},(err, clusters) => {
        t.notok(err, `there was no error`)
        t.equal(clusters.length, 1, `there is 1 cluster`)
        t.equal(clusters[0].name, 'othercluster', 'the remaining cluster is correct')
        t.end()
      })
    })
    
  })


})