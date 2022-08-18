const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const asyncTest = require('../asyncTest')

const ClusterStore = require('../../src/store/cluster').default
const config = require('../../src/config')

const { CLUSTER_STATUS, CLUSTER_PROVISION_TYPE, CLUSTER_STATUS_DEFAULT } = config

database.testSuiteWithDatabase((getConnection) => {
  let testCluster = null

  asyncTest('cluster store -> list no data', async (t) => {
    const store = ClusterStore(getConnection())
    const clusters = await store.list({})
    t.equal(clusters.length, 0, 'there were no clusters')
  })

  asyncTest('cluster store -> create with missing values', async (t) => {
    const store = ClusterStore(getConnection())

    await tools.insertWithMissingValues(t, store, {
      name: 'testcluster',
      provision_type: CLUSTER_PROVISION_TYPE.aws_ec2,
      desired_state: {
        apples: 10,
      },
    })
  })

  asyncTest('cluster store -> create with bad provision_type', async (t) => {
    const store = ClusterStore(getConnection())
    let error = null

    try {
      await store.create({
        data: {
          name: 'testcluster',
          provision_type: 'silly_provision_type',
          desired_state: {
            apples: 10,
          },
        },
      })
    } catch (err) {
      error = err
    }
    t.ok(error, 'there was an error')
  })

  asyncTest('cluster store -> create clusters', async (t) => {
    const compareCluster = fixtures.SIMPLE_CLUSTER_DATA[0]

    const clusters = await fixtures.insertTestClusters(getConnection())

    testCluster = clusters[compareCluster.name]

    t.deepEqual(testCluster.applied_state, {}, 'the applied_state defaults to empty object')
    t.deepEqual(testCluster.desired_state, compareCluster.desired_state, 'the desired_state is correct')
    t.equal(testCluster.name, compareCluster.name, 'the name is correct')
    t.equal(testCluster.provision_type, compareCluster.provision_type, 'the provision_type is correct')
    t.equal(testCluster.status, CLUSTER_STATUS_DEFAULT, 'the state defaults to created')
    t.equal(testCluster.maintenance_flag, false, 'the maintenance_flag defaults to false')
  })

  asyncTest('cluster store -> list with ordered data', async (t) => {
    const store = ClusterStore(getConnection())

    const expectedCount = fixtures.SIMPLE_CLUSTER_DATA.length
    const expectedOrder = fixtures.SIMPLE_CLUSTER_DATA.map((d) => d.name)
    expectedOrder.sort()
    const clusters = await store.list({})
    t.equal(clusters.length, expectedCount, `there were ${expectedCount} clusters`)
    t.deepEqual(
      clusters.map((cluster) => cluster.name),
      expectedOrder,
      'the clusters were in the correct order'
    )
  })

  asyncTest('cluster store -> get', async (t) => {
    const compareCluster = fixtures.GET_CLUSTER_DATA[0]

    const clusters = await fixtures.insertTestClusters(getConnection(), fixtures.GET_CLUSTER_DATA)

    // add the active deployment feild that shows up in the get route response after the join with the deployment table
    const joinedCluster = clusters[compareCluster.name]
    joinedCluster.active_deployments = '0'

    const store = ClusterStore(getConnection())
    const cluster = await store.get({
      id: joinedCluster.id,
    })
    t.deepEqual(cluster, joinedCluster, 'the returned cluster is correct')
  })

  asyncTest('cluster store -> update with bad status', async (t) => {
    const store = ClusterStore(getConnection())
    let error = null
    try {
      await store.update({
        id: testCluster.id,
        data: {
          status: 'oranges',
        },
      })
    } catch (err) {
      error = err
    }
    t.ok(error, 'there was an error')
  })

  asyncTest('cluster store -> update', async (t) => {
    const store = ClusterStore(getConnection())

    const insertedCluster = await store.update({
      id: testCluster.id,
      data: {
        status: CLUSTER_STATUS.provisioned,
      },
    })

    t.equal(insertedCluster.status, CLUSTER_STATUS.provisioned, 'the new status is correct')

    const getCluster = await store.get({
      id: testCluster.id,
    })

    t.equal(getCluster.status, CLUSTER_STATUS.provisioned, 'querying on the updated cluster is working')
  })

  asyncTest('cluster store -> delete', async (t) => {
    const allClusterDataLength = fixtures.SIMPLE_CLUSTER_DATA.length + fixtures.GET_CLUSTER_DATA.length
    const store = ClusterStore(getConnection())

    await store.delete({
      id: testCluster.id,
    })

    const clusters = await store.list({})
    t.equal(clusters.length, allClusterDataLength - 1, 'there is 1 less cluster')
  })

  asyncTest('cluster store -> list with deleted', async (t) => {
    const allClusterDataLength = fixtures.SIMPLE_CLUSTER_DATA.length + fixtures.GET_CLUSTER_DATA.length

    const store = ClusterStore(getConnection())

    const expectedCount = allClusterDataLength
    const clusters = await store.list({
      deleted: true,
    })
    t.equal(clusters.length, expectedCount, `there are ${expectedCount} clusters`)
  })
})
