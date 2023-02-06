const asyncTest = require('../asyncTest')
const { CLUSTER_STATUS, CLUSTER_PROVISION_TYPE } = require('../../src/config')
const database = require('../database')
const fixtures = require('../fixtures')
const { ClusterStatusTracker } = require('../../src/jobs/ClusterStatusTracker')
const Store = require('../../src/store')

const PG_CLUSTER_DATA = [
  {
    name: 'cluster1',
    id: 1,
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.provisioned,
    desired_state: {
      state: 'a desired state',
    },
    capabilities: {
      invisibility: true,
    },
  },
  {
    name: 'cluster2',
    id: 2,
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.provisioned,
    desired_state: {
      state: 'a desired state',
    },
    capabilities: {
      invisibility: true,
    },
  },
  {
    name: 'cluster3',
    id: 3,
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.error,
    desired_state: {
      state: 'a desired state',
    },
    capabilities: {
      invisibility: true,
    },
  },
  {
    name: 'cluster4',
    id: 4,
    provision_type: CLUSTER_PROVISION_TYPE.remote,
    status: CLUSTER_STATUS.provisioned,
    desired_state: {
      state: 'a desired state',
    },
    capabilities: {
      invisibility: true,
    },
  },
]

const KUBERNETES_CLUSTER_DATA = {
  cluster1: {
    // mocks a successful response from kubectl
    namespaces: ['default', 'kube-system'],
  },
  cluster2: {
    // mocks an errored response from kubectl
    namespaces: undefined,
  },
  cluster3: {
    // mocks a successful response from kubectl
    namespaces: ['default', 'kube-system'],
  },
  cluster4: {
    // mocks an errored response from kubectl
    namespaces: undefined,
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

    return namespaces
  }
}

database.testSuiteWithDatabase((getConnection) => {
  asyncTest('Seed DB with clusters', async () => {
    const clusters = await fixtures.insertTestClusters(getConnection(), PG_CLUSTER_DATA)
    return clusters
  })

  asyncTest('getAllClusters -> should return a list of the clusters that were just added', async (test) => {
    const store = Store(getConnection())
    const clusterStatusTracker = new ClusterStatusTracker(store, MockKubectl, true)

    const clusters = await clusterStatusTracker.getAllClusters()
    const clusterNames = clusters.map((cluster) => cluster.name).sort()
    const expectedClusterNames = PG_CLUSTER_DATA.map((cluster) => cluster.name).sort()
    test.deepEqual(clusterNames, expectedClusterNames)
  })

  asyncTest('updateCluster -> should update a cluster status', async (test) => {
    const store = Store(getConnection())
    const clusterStatusTracker = new ClusterStatusTracker(store, MockKubectl, true)

    const cluster = await store.cluster.get({ id: 4 })
    const updatedCluster = await clusterStatusTracker.updateClusterStatus(cluster, CLUSTER_STATUS.error)
    test.deepEqual(updatedCluster.status, CLUSTER_STATUS.error)
  })

  asyncTest(
    "ping() should not update a provisioned cluster's status if Kubernetes returns a list of namespaces",
    async (test) => {
      const store = Store(getConnection())
      const clusterStatusTracker = new ClusterStatusTracker(store, MockKubectl, true)

      await clusterStatusTracker.ping(PG_CLUSTER_DATA[0])
      const cluster1 = await store.cluster.get({ id: 1 })
      test.deepEqual(cluster1.status, CLUSTER_STATUS.provisioned)
    }
  )

  asyncTest(
    "ping() should update a provisioned cluster's status to error if Kubernetes returns an empty list of namespaces",
    async (test) => {
      const store = Store(getConnection())
      const clusterStatusTracker = new ClusterStatusTracker(store, MockKubectl, true)

      await clusterStatusTracker.ping(PG_CLUSTER_DATA[1], MockKubectl)
      const cluster2 = await store.cluster.get({ id: 2 })
      test.deepEqual(cluster2.status, CLUSTER_STATUS.error)
    }
  )

  asyncTest(
    "ping() should update an error cluster's status to provisioned if Kubernetes returns a list of namespaces",
    async (test) => {
      const store = Store(getConnection())
      const clusterStatusTracker = new ClusterStatusTracker(store, MockKubectl, true)

      await clusterStatusTracker.ping(PG_CLUSTER_DATA[2], MockKubectl)
      const cluster3 = await store.cluster.get({ id: 3 })
      test.deepEqual(cluster3.status, CLUSTER_STATUS.provisioned)
    }
  )
})
