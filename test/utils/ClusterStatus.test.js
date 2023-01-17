const asyncTest = require('../asyncTest')
const { CLUSTER_STATUS, CLUSTER_PROVISION_TYPE } = require('../../src/config')
const database = require('../database')
const fixtures = require('../fixtures')
const { ClusterStatus } = require('../../src/jobs/ClusterStatus')
const Store = require('../../src/store')

const PG_CLUSTER_DATA = [
  {
    name: 'cluster1',
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.provisioned,
  },
  {
    name: 'cluster2',
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.provisioned,
  },
  {
    name: 'cluster3',
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.error,
  },
  {
    name: 'cluster4',
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.provisioned,
  },
]

const KUBERNETES_CLUSTER_DATA = {
  cluster1: {
    namespaces: ['default', 'kube-system'],
  },
  cluster2: {
    namespaces: [],
  },
  cluster3: {
    namespaces: ['default', 'kube-system'],
  },
  cluster4: {
    namespaces: [],
  },
}

class MockKubectl {
  constructor(cluster) {
    this.cluster = cluster
    this.k8sClusterData = KUBERNETES_CLUSTER_DATA
  }

  getNamespaces() {
    const clusterName = this.cluster.name
    const { namespaces } = this.k8sClusterData[clusterName]
    if (namespaces === []) {
      // if there are no namespaces - throw an error
      throw new Error(CLUSTER_STATUS.error)
    }
    // otherwise return the array of namespaces
    return namespaces
  }
}

database.testSuiteWithDatabase((getConnection) => {
  const store = new Store(getConnection())
  const clusterStatus = new ClusterStatus(store)

  asyncTest('Seed DB with clusters', async () => {
    const clusters = await fixtures.insertTestClusters(getConnection(), PG_CLUSTER_DATA)
    return clusters
  })

  asyncTest('getAllClusters -> should return a list of the clusters that were just added', async (test) => {
    const clusters = await clusterStatus.getAllClusters()
    const clusterNames = clusters.map((cluster) => cluster.name)
    const expectedClusterNames = PG_CLUSTER_DATA.map((cluster) => cluster.name)
    test.deepEqual(clusterNames, expectedClusterNames)
  })

  asyncTest('updateCluster -> should update a cluster status', async (test) => {
    const cluster = await store.getClusterByName('cluster4')
    const updatedCluster = await clusterStatus.updateCluster(cluster, CLUSTER_STATUS.error)
    test.deepEqual(updatedCluster.status, CLUSTER_STATUS.error)
  })

  asyncTest(
    "inquire() should not update a provisioned cluster's status if Kubernetes returns a list of namespaces",
    async (test) => {
      await clusterStatus.inquire(PG_CLUSTER_DATA[0], MockKubectl)
      const cluster1 = await store.getClusterByName('cluster1')
      test.deepEqual(cluster1.status, CLUSTER_STATUS.provisioned)
    }
  )

  asyncTest(
    "inquire() should update a provisioned cluster's status to error if Kubernetes returns an empty list of namespaces",
    async (test) => {
      await clusterStatus.inquire(PG_CLUSTER_DATA[1], MockKubectl)
      const cluster2 = await store.getClusterByName('cluster2')
      test.deepEqual(cluster2.status, CLUSTER_STATUS.error)
    }
  )

  asyncTest(
    "inquire() should update an error cluster's status to provisioned if Kubernetes returns a list of namespaces",
    async (test) => {
      await clusterStatus.inquire(PG_CLUSTER_DATA[2], MockKubectl)
      const cluster3 = await store.getClusterByName('cluster3')
      test.deepEqual(cluster3.status, CLUSTER_STATUS.provisioned)
    }
  )
})
