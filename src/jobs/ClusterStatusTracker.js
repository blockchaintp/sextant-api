const { date } = require('yup')
const logger = require('../logging').getLogger({
  name: 'jobs/ClusterStatus',
})

const { CLUSTER_STATUS } = require('../config')
const ProductionClusterKubectl = require('../utils/clusterKubectl')

class ClusterStatusTracker {
  constructor(Store, ClusterKubectl = ProductionClusterKubectl, test = false) {
    this.store = Store
    this.ClusterKubectl = ClusterKubectl
    this.test = test
    this.clusterStore = Store.cluster
  }

  async getAllClusters() {
    // get a list of all of the clusters in the database
    const clusters = await this.clusterStore.list({
      deleted: false,
    })
    logger.debug({
      fn: 'getAllClusters',
      clusters: clusters.map((cluster) => cluster.name),
    })
    return clusters
  }

  async updateClusterStatus(cluster, status) {
    const updatedCluster = await this.clusterStore.update({
      id: cluster.id,
      data: { status },
    })
    logger.debug({
      fn: 'updateClusterStatus',
      updatedCluster: { name: updatedCluster.name, status: updatedCluster.status },
    })
    return updatedCluster
  }

  async defineClusterKubectl(cluster, store) {
    if (this.test === true) {
      const testVersion = new this.ClusterKubectl(cluster)
      return testVersion
    }
    const defaultVersion = await this.ClusterKubectl({ cluster, store })
    return defaultVersion
  }

  async ping(cluster) {
    const clusterKubectl = await this.defineClusterKubectl(cluster, this.store)

    try {
      const namespaces = await clusterKubectl.getNamespaces()
      if (namespaces && cluster.satus === CLUSTER_STATUS.provisioned) {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          updatedStatus: CLUSTER_STATUS.provisioned,
          timestamp: date.now(),
          note: 'Cluster status is provisioned, no need to update.',
        })
      }

      if (namespaces && cluster.status === CLUSTER_STATUS.error) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.provisioned)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          updatedStatus: CLUSTER_STATUS.provisioned,
        })
      }

      if (!namespaces && cluster.status === CLUSTER_STATUS.provisioned) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          updatedStatus: CLUSTER_STATUS.error,
        })
      } else if (!namespaces) {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          updatedStatus: CLUSTER_STATUS.error,
        })
        throw new Error('Cluster is not provisioned')
      }
    } catch (error) {
      logger.error({
        fn: 'ping',
        cluster: cluster.name,
        error,
      })
      if (cluster.status !== CLUSTER_STATUS.error) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          updatedStatus: CLUSTER_STATUS.error,
          namespaces: 0,
        })
      } else {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          updatedStatus: CLUSTER_STATUS.error,
          namespaces: 0,
          note: 'Cluster status is already error, no need to update.',
        })
      }
    }
  }

  async run() {
    logger.info('Running cluster status job')
    const clusters = await this.getAllClusters()
    logger.debug({
      fn: 'run',
      clusters: clusters.map((cluster) => cluster.name),
    })
    await clusters.forEach(this.ping.bind(this))
  }
}

module.exports = { ClusterStatusTracker }