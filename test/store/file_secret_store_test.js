/*

  the file store and secret store are basically the same

  we do this so we can re-implement the secret store later on

  this helper runs the same tests against both stores

*/
const tape = require('tape')

const database = require('../database')
const fixtures = require('../fixtures')

const tools = require('../tools')
const asyncTest = require('../asyncTest')
const base64 = require('../../src/utils/base64')

const FileSecretStoreTest = ({
  GetStore,
  title,
}) => database.testSuiteWithDatabase(getConnection => {

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

  asyncTest(`${title} store -> create clusters`, async (t) => {
    const clusters = await fixtures.insertTestClusters(getConnection())
    clusterMap = clusters
    testCluster = clusters[fixtures.SIMPLE_CLUSTER_DATA[0].name]
  })

  asyncTest(`${title} store -> create file`, async (t) => {
    const store = GetStore(getConnection())
    const file = await store.create({
      data: {
        cluster: testCluster.id,
        name: testFile.name,
        rawData: testFile.rawData,
      }
    })
    t.equal(file.cluster, testCluster.id, `the cluster is correct`)
    t.equal(file.name, testFile.name, `the name is correct`)
    t.equal(file.base64data, testFile.base64data, `the base64data is correct`)
    t.equal(base64.decodeToString(file.base64data), testFile.rawData, `the plainData is correct`)
  })

  asyncTest(`${title} store -> create file with base64 data`, async (t) => {
  
    const store = GetStore(getConnection())

    const file = await store.create({
      data: {
        cluster: testCluster.id,
        name: `base64-${testFile.name}`,
        base64Data: testFile.base64data,
      }
    })
    t.equal(file.cluster, testCluster.id, `the cluster is correct`)
    t.equal(file.name, `base64-${testFile.name}`, `the name is correct`)
    t.equal(file.base64data, testFile.base64data, `the base64data is correct`)
    t.equal(base64.decodeToString(file.base64data), testFile.rawData, `the plainData is correct`)
  })

  asyncTest(`${title} store -> list files`, async (t) => {
  
    const store = GetStore(getConnection())

    const files = await store.list({
      cluster: testCluster.id,
    })
    t.equal(files.length, 2, `there are two files`)
    t.equal(files[0].cluster, testCluster.id, `the cluster is correct`)
    t.equal(files[0].name, testFile.name, `the name is correct`)
    t.equal(files[0].base64data, testFile.base64data, `the base64data is correct`)
    t.equal(base64.decodeToString(files[0].base64data), testFile.rawData, `the plainData is correct`)    
  })

  asyncTest(`${title} store -> get file`, async (t) => {
  
    const store = GetStore(getConnection())

    const testCluster = clusterMap.testcluster

    const file = await store.get({
      cluster: testCluster.id,
      name: testFile.name,
    })
    t.equal(file.cluster, testCluster.id, `the cluster is correct`)
    t.equal(file.name, testFile.name, `the name is correct`)
    t.equal(file.base64data, testFile.base64data, `the base64data is correct`)
    t.equal(base64.decodeToString(file.base64data), testFile.rawData, `the plainData is correct`)
  })

  asyncTest(`${title} store -> update file`, async (t) => {
  
    const store = GetStore(getConnection())

    const testCluster = clusterMap.testcluster

    await store.update({
      cluster: testCluster.id,
      name: testFile.name,
      data: {
        rawData: testFile.updatedRawData,
      }
    })

    const file = await store.get({
      cluster: testCluster.id,
      name: testFile.name,
    })

    t.equal(file.base64data, testFile.updatedBase64Data, `the base64data is correct`)
    t.equal(base64.decodeToString(file.base64data), testFile.updatedRawData, `the plainData is correct`)
  })

  asyncTest(`${title} store -> update file with base64 data`, async (t) => {
  
    const store = GetStore(getConnection())

    const testCluster = clusterMap.testcluster

    await store.update({
      cluster: testCluster.id,
      name: testFile.name,
      data: {
        base64Data: testFile.updatedBase64Data,
      }
    })

    const file = await store.get({
      cluster: testCluster.id,
      name: testFile.name,
    })

    t.equal(file.base64data, testFile.updatedBase64Data, `the base64data is correct`)
    t.equal(base64.decodeToString(file.base64data), testFile.updatedRawData, `the plainData is correct`)  
  })

  asyncTest(`${title} store -> delete file`, async (t) => {
  
    const store = GetStore(getConnection())

    const testCluster = clusterMap.testcluster

    await store.delete({
      cluster: testCluster.id,
      name: testFile.name,
    })

    const files = await  store.list({
      cluster: testCluster.id,
    })

    t.equal(files.length, 1, `there is only 1 file`)
  })


})

module.exports = FileSecretStoreTest