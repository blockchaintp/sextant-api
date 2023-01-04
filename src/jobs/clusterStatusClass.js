const Scheduler = require('node-schedule')
const logger = require('../logging').getLogger({
  name: 'jobs/clusterStatus',
})

const { CLUSTER_STATUS } = require('../config')
const ClusterKubectl = require('../utils/clusterKubectl')

class ClusterInquiry {
  constructor(store) {
    this.store = store
  }

  async getAllClusters() {
    // get a list of all of the clusters in the database
    const clusters = await this.store.cluster.list({
      deleted: false,
    })
    logger.debug({
      fn: 'getAllClusters',
      clusters,
    })
    return clusters
  }

  async updateClusterStatus(cluster, status) {
    // set the cluster as inactive (deleted?)
    const updatedCluster = await this.store.cluster.update({
      id: cluster.id,
      status,
    })
    logger.debug({
      fn: 'updateClusterStatus',
      updatedCluster: { name: updatedCluster.name, status: updatedCluster.status },
    })
    return updatedCluster
  }

  async inquire(cluster) {
    const clusterKubectl = await ClusterKubectl(cluster, this.store)
    try {
      await clusterKubectl.getNamespaces()
      // if the status is good - update the cluster status to active
      if (cluster.status === CLUSTER_STATUS.error) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.provisioned)
      }
    } catch (e) {
      // if the status is bad - update the cluster status to inactive
      if (cluster.status === CLUSTER_STATUS.provisioned) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
      }
    }
  }

  async run() {
    const clusters = await this.getAllClusters(this.store)
    await clusters.forEach(this.inquire.bind(this))
    // thinking I need to use bind here to make sure the context is correct - I'm not sure
  }

  start() {
    logger.info('Starting cluster status job')
    this.job = Scheduler.scheduleJob('ping_clusters', '*/10 * * * *', () => {
      this.run()
    })
  }
}

module.exports = ClusterInquiry
