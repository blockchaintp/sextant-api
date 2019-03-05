'use strict'

const tape = require('tape')
const async = require('async')

const database = require('../database')
const fixtures = require('../fixtures')

const UserStore = require('../../src/store/user')
const ClusterStore = require('../../src/store/cluster')
const enumerations = require('../../src/enumerations')

database.testSuiteWithDatabase(getConnection => {

  tape('cluster store -> list no data', (t) => {

    const store = ClusterStore(getConnection())
  
    store.list({}, (err, users) => {
      t.notok(err, `there was no error`)
      t.equal(users.length, 0, `there were no clusters`)
      t.end()
    })
    
  })
  
  tape('cluster store -> insert with no name', (t) => {
  
    const store = ClusterStore(getConnection())
  
    store.create({
      provision_type: 'aws_ec2',
      desired_state: {
        apples: 10,
      },
    }, (err, user) => {
      t.ok(err, `there was an error`)
      t.end()
    })  
  })

  tape('cluster store -> insert with no provision_type', (t) => {
  
    const store = ClusterStore(getConnection())
  
    store.create({
      name: 'testcluster',
      desired_state: {
        apples: 10,
      },
    }, (err, user) => {
      t.ok(err, `there was an error`)
      t.end()
    })  
  })

  tape('cluster store -> insert with no desired_state', (t) => {
  
    const store = ClusterStore(getConnection())
  
    store.create({
      name: 'testcluster',
      provision_type: 'aws_ec2',
    }, (err, user) => {
      t.ok(err, `there was an error`)
      t.end()
    })  
  })

  tape('cluster store -> insert with bad provision_type', (t) => {
  
    const store = ClusterStore(getConnection())
  
    store.create({
      name: 'testcluster',
      provision_type: 'silly_provision_type',
      desired_state: {
        apples: 10,
      },
    }, (err, user) => {
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
      t.equal(clusters.testcluster.provision_type, compareCluster.provision_type, `the provision_type is correct`)
      t.equal(clusters.testcluster.status, enumerations.CLUSTER_STATUS_DEFAULT, `the state defaults to created`)
      t.equal(clusters.testcluster.maintenance_flag, false, `the maintenance_flag defaults to false`)
      t.end()
    })
  
  })

})