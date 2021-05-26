/* eslint-disable max-len */
const database = require('../database')
const fixtures = require('../fixtures')
const tools = require('../tools')

const asyncTest = require('../asyncTest')

const DeploymentStore = require('../../src/store/deployment')
const config = require('../../src/config')

const {
  DEPLOYMENT_STATUS,
  DEPLOYMENT_STATUS_DEFAULT,
} = config

database.testSuiteWithDatabase((getConnection) => {
  let testCluster = null
  let testDeployment = null
  // eslint-disable-next-line no-unused-vars
  let deploymentMap = {}

  asyncTest('deployment store -> create clusters', async () => {
    const clusters = await fixtures.insertTestClusters(getConnection())
    testCluster = clusters[fixtures.SIMPLE_CLUSTER_DATA[0].name]
  })

  asyncTest('deployment store -> list with no cluster id', async (t) => {
    const store = DeploymentStore(getConnection())

    let error = null

    try {
      await store.list({})
    } catch (err) {
      error = err
    }
    t.ok(error, 'there was an error')
  })

  asyncTest('deployment store -> list no data', async (t) => {
    const store = DeploymentStore(getConnection())
    const deployments = await store.list({
      cluster: testCluster.id,
    })
    t.equal(deployments.length, 0, 'there were no deployments')
  })

  asyncTest('deployment store -> create with missing values', async (t) => {
    const store = DeploymentStore(getConnection())
    await tools.insertWithMissingValues(t, store, {
      name: 'testdeployment',
      cluster: testCluster.id,
      desired_state: {
        apples: 10,
      },
    })
  })

  asyncTest('deployment store -> create deployments', async (t) => {
    const compareDeployment = fixtures.SIMPLE_DEPLOYMENT_DATA[0]

    const deployments = await fixtures.insertTestDeployments(getConnection(), testCluster.id)

    testDeployment = deployments[compareDeployment.name]
    t.equal(testDeployment.cluster, testCluster.id, 'the cluster is the correct id')
    t.deepEqual(testDeployment.applied_state, {}, 'the applied_state defaults to empty object')
    t.deepEqual(testDeployment.desired_state, compareDeployment.desired_state, 'the desired_state is correct')
    t.equal(testDeployment.name, compareDeployment.name, 'the name is correct')
    t.equal(testDeployment.status, DEPLOYMENT_STATUS_DEFAULT, 'the state defaults to created')
    t.equal(testDeployment.maintenance_flag, false, 'the maintenance_flag defaults to false')
    deploymentMap = deployments
  })

  asyncTest('deployment store -> list with ordered data', async (t) => {
    const store = DeploymentStore(getConnection())

    const expectedCount = fixtures.SIMPLE_DEPLOYMENT_DATA.length
    const expectedOrder = fixtures.SIMPLE_DEPLOYMENT_DATA.map((d) => d.name)

    expectedOrder.sort()
    const deployments = await store.list({
      cluster: testCluster.id,
    })
    t.equal(deployments.length, expectedCount, `there were ${expectedCount} deployments`)
    t.deepEqual(deployments.map((deployment) => deployment.name), expectedOrder, 'the deployments were in the correct order')
  })

  asyncTest('deployment store -> get', async (t) => {
    const store = DeploymentStore(getConnection())
    const deployment = await store.get({
      id: testDeployment.id,
    })
    t.deepEqual(deployment, testDeployment, 'the returned deployment is correct')
  })

  asyncTest('deployment store -> update with bad status', async (t) => {
    const store = DeploymentStore(getConnection())

    let error = null
    try {
      await store.update({
        id: testDeployment.id,
        data: {
          status: 'oranges',
        },
      })
    } catch (err) {
      error = err
    }

    t.ok(error, 'there was an error')
  })

  asyncTest('deployment store -> update', async (t) => {
    const store = DeploymentStore(getConnection())

    const createdDeployment = await store.update({
      id: testDeployment.id,
      data: {
        status: DEPLOYMENT_STATUS.provisioned,
      },
    })

    t.equal(createdDeployment.status, DEPLOYMENT_STATUS.provisioned, 'the new status is correct')

    const getDeployment = await store.get({
      id: testDeployment.id,
    })

    t.equal(getDeployment.status, DEPLOYMENT_STATUS.provisioned, 'querying on the updated cluster is working')
  })

  asyncTest('deployment store -> delete', async (t) => {
    const store = DeploymentStore(getConnection())

    await store.delete({
      id: testDeployment.id,
    })

    const deployments = await store.list({
      cluster: testCluster.id,
    })
    t.equal(deployments.length, fixtures.SIMPLE_DEPLOYMENT_DATA.length - 1, 'there is 1 less deployment')
  })
})
