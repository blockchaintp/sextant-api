'use strict'

const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')

const ClusterFileStore = require('../../src/store/clusterfile')
const base64 = require('../../src/utils/base64')
const config = require('../../src/config')

const {
  DEPLOYMENT_STATUS,
} = config

database.testSuiteWithDatabase(getConnection => {

  let clusterMap = {}
  let testCluster = null

  const testFileRawData = 'hello world'
  const testFileUpdatedRawData = 'i like oranges'
  const testFile = {
    name: 'apples.txt',
    rawData: testFileRawData,
    updatedRawData: testFileUpdatedRawData,
    base64data: base64.encode(testFileRawData),
    updatedBase64Data: base64.encode(testFileUpdatedRawData),
  }

  tape('clusterfile store -> create clusters', (t) => {

    fixtures.insertTestClusters(getConnection(), (err, clusters) => {
      t.notok(err, `there was no error`)      
      clusterMap = clusters
      testCluster = clusters[fixtures.SIMPLE_CLUSTER_DATA[0].name]
      t.end()
    })
  
  })

  tape('clusterfile store -> create file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    store.create({
      data: {
        cluster: testCluster.id,
        name: testFile.name,
        rawData: testFile.rawData,
      }
    }, (err, file) => {
      t.notok(err, `there was no error`)
      t.equal(file.cluster, testCluster.id, `the cluster is correct`)
      t.equal(file.name, testFile.name, `the name is correct`)
      t.equal(file.base64data, testFile.base64data, `the base64data is correct`)
      t.equal(base64.decodeToString(file.base64data), testFile.rawData, `the plainData is correct`)
      t.end()
    })
    
  })

  tape('clusterfile store -> list files', (t) => {
  
    const store = ClusterFileStore(getConnection())

    store.list({
      cluster: testCluster.id,
    }, (err, files) => {
      t.notok(err, `there was no error`)
      t.equal(files.length, 1, `there is one file`)
      t.equal(files[0].cluster, testCluster.id, `the cluster is correct`)
      t.equal(files[0].name, testFile.name, `the name is correct`)
      t.equal(files[0].base64data, testFile.base64data, `the base64data is correct`)
      t.equal(base64.decodeToString(files[0].base64data), testFile.rawData, `the plainData is correct`)
      t.end()
    })
    
  })

  tape('clusterfile store -> get file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    store.get({
      cluster: testCluster.id,
      name: testFile.name,
    }, (err, file) => {
      t.notok(err, `there was no error`)
      t.equal(file.cluster, testCluster.id, `the cluster is correct`)
      t.equal(file.name, testFile.name, `the name is correct`)
      t.equal(file.base64data, testFile.base64data, `the base64data is correct`)
      t.equal(base64.decodeToString(file.base64data), testFile.rawData, `the plainData is correct`)
      t.end()
    })
    
  })

  tape('clusterfile store -> update file', (t) => {
  
    const store = ClusterFileStore(getConnection())

    const testCluster = clusterMap.testcluster

    store.update({
      cluster: testCluster.id,
      name: testFile.name,
      data: {
        rawData: testFile.updatedRawData,
      }
    }, (err, file) => {
      t.notok(err, `there was no error`)
      store.get({
        cluster: testCluster.id,
        name: testFile.name,
      }, (err, file) => {
        t.notok(err, `there was no error`)
        t.equal(file.base64data, testFile.updatedBase64Data, `the base64data is correct`)
        t.equal(base64.decodeToString(file.base64data), testFile.updatedRawData, `the plainData is correct`)
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
      name: testFile.name,
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