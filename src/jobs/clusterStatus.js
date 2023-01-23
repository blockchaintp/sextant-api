const Scheduler = require('node-schedule')
const { date } = require('yup')
const logger = require('../logging').getLogger({
  name: 'jobs/ClusterStatus',
})

const { CLUSTER_STATUS } = require('../config')
const ProductionClusterKubectl = require('../utils/clusterKubectl')

class ClusterStatus {
  constructor(clusterStore, ClusterKubectl = ProductionClusterKubectl, test = false) {
    this.clusterStore = clusterStore
    this.ClusterKubectl = ClusterKubectl
    this.test = test
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
    let clusterKubectl

    if (this.test === true) {
      clusterKubectl = new this.ClusterKubectl(cluster)
    } else {
      clusterKubectl = await this.clusterKubectl({ cluster, store: this.store })
    }

    try {
      const namespaces = await clusterKubectl.getNamespaces()
      if (namespaces && cluster.satus === CLUSTER_STATUS.provisioned) {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          currentStatus: CLUSTER_STATUS.provisioned,
          timestamp: date.now(),
          note: 'Cluster status is provisioned, no need to update.',
        })
      }

      if (namespaces && cluster.status !== CLUSTER_STATUS.provisioned) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.provisioned)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          currentStatus: CLUSTER_STATUS.provisioned,
        })
      }

      if (!namespaces && cluster.status === CLUSTER_STATUS.provisioned) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          currentStatus: CLUSTER_STATUS.error,
        })
      } else if (!namespaces) {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.length,
          currentStatus: CLUSTER_STATUS.error,
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
          currentStatus: CLUSTER_STATUS.error,
          namespaces: 0,
        })
      }
    }
  }

  async run() {
    const clusters = await this.getAllClusters(this.store)
    await clusters.forEach(this.ping.bind(this))
  }

  start() {
    logger.info('Starting cluster status job')
    this.job = Scheduler.scheduleJob('cluster_inquiery', '*/10 * * * *', () => {
      this.run()
    })
  }
}

module.exports = { ClusterStatus }
