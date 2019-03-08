'use strict'

const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')

const ClusterFileStore = require('../../src/store/clusterfile')
const base64 = require('../../src/utils/base64')

database.testSuiteWithDatabase(getConnection => {

  let clusterMap = {}

  tape('clusterfile store -> create clusters', (t) => {

    fixtures.insertTestClusters(getConnection(), (err, clusters) => {
      t.notok(err, `there was no error`)      
      clusterMap = clusters
      t.end()
    })
  
  })

  tape('clusterfile store -> create file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    const name = 'apples.txt'
    const plainData = 'hello world'
    const base64data = base64.encode(plainData)
  
    store.create({
      data: {
        cluster: testCluster.id,
        name,
        base64data,
      }
    }, (err, file) => {
      t.notok(err, `there was no error`)
      t.equal(file.cluster, testCluster.id, `the cluster is correct`)
      t.equal(file.name, name, `the name is correct`)
      t.equal(file.base64data, base64data, `the base64data is correct`)
      t.equal(base64.decodeToString(file.base64data), plainData, `the plainData is correct`)
      t.end()
    })
    
  })

  tape('clusterfile store -> list files', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    const name = 'apples.txt'
    const plainData = 'hello world'
    const base64data = base64.encode(plainData)
  
    store.list({
      cluster: testCluster.id,
    }, (err, files) => {
      t.notok(err, `there was no error`)
      t.equal(files.length, 1, `there is one file`)
      t.equal(files[0].cluster, testCluster.id, `the cluster is correct`)
      t.equal(files[0].name, name, `the name is correct`)
      t.equal(files[0].base64data, base64data, `the base64data is correct`)
      t.equal(base64.decodeToString(files[0].base64data), plainData, `the plainData is correct`)
      t.end()
    })
    
  })

  tape('clusterfile store -> get file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    const name = 'apples.txt'
    const plainData = 'hello world'
    const base64data = base64.encode(plainData)
  
    store.get({
      cluster: testCluster.id,
      name,
    }, (err, file) => {
      t.notok(err, `there was no error`)
      t.equal(file.cluster, testCluster.id, `the cluster is correct`)
      t.equal(file.name, name, `the name is correct`)
      t.equal(file.base64data, base64data, `the base64data is correct`)
      t.equal(base64.decodeToString(file.base64data), plainData, `the plainData is correct`)
      t.end()
    })
    
  })

  tape('clusterfile store -> update file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    const name = 'apples.txt'
    const plainData = 'i like oranges'
    const base64data = base64.encode(plainData)
  
    store.update({
      cluster: testCluster.id,
      name,
      data: {
        base64data,
      }
    }, (err, file) => {
      t.notok(err, `there was no error`)
      store.get({
        cluster: testCluster.id,
        name,
      }, (err, file) => {
        t.notok(err, `there was no error`)
        t.equal(file.base64data, base64data, `the base64data is correct`)
        t.equal(base64.decodeToString(file.base64data), plainData, `the plainData is correct`)
        t.end()
      })
    })
    
  })

  tape('clusterfile store -> delete file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    const name = 'apples.txt'
  
    store.delete({
      cluster: testCluster.id,
      name,
    }, (err) => {
      t.notok(err, `there was no error`)
      store.list({
        cluster: testCluster.id,
      }, (err, files) => {
        t.notok(err, `there was no error`)
        t.equal(files.length, 0, `there are no files`)
        t.end()
      })
    })
    
  })


})