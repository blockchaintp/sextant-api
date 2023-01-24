// const Scheduler = require('node-schedule')
// const logger = require('../logging').getLogger({
//   name: 'jobs/ClusterStatus',
// })

// const { CLUSTER_STATUS } = require('../config')
// const ProductionClusterKubectl = require('../utils/clusterKubectl')

// class TrackClusterStatus {
//   constructor(clusterStore, ClusterKubectl = ProductionClusterKubectl, test = false) {
//     this.clusterStore = clusterStore
//     this.ClusterKubectl = ClusterKubectl
//     this.test = test
//   }

//   async getAllClusters() {
//     // get a list of all of the clusters in the database
//     const clusters = await this.clusterStore.list({
//       deleted: false,
//     })
//     logger.debug({
//       fn: 'getAllClusters',
//       clusters,
//     })
//     return clusters
//   }

//   async updateClusterStatus(cluster, status) {
//     const updatedCluster = await this.clusterStore.update({
//       id: cluster.id,
//       data: { status },
//     })
//     logger.debug({
//       fn: 'updateClusterStatus',
//       updatedCluster: { name: updatedCluster.name, status: updatedCluster.status },
//     })
//     return updatedCluster
//   }

//   async defineClusterKubectl(cluster, store) {
//     if (this.test === true) {
//       const testVersion = new this.ClusterKubectl(cluster)
//       return testVersion
//     }
//     const defaultVersion = await this.ClusterKubectl({ cluster, store })
//     return defaultVersion
//   }

//   async ping(cluster) {
//     const clusterKubectl = this.defineClusterKubectl(cluster, this.store)

//     try {
//       const namespaces = await clusterKubectl.getNamespaces()
//       // ping should still update the status even if it's the same
//       // since it will update the timestamp and knowing the last time
//       // the cluster was verified to be good is useful information
//       // we may need to add a new status for this . . . ?
//       if (namespaces) {
//         await this.updateClusterStatus(cluster, CLUSTER_STATUS.provisioned)
//       } else {
//         await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
//         return false
//       }
//     } catch (e) {
//       if (cluster.status !== CLUSTER_STATUS.error) {
//         await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
//         return false
//       }
//     }

//     return true
//   }

//   async run() {
//     const clusters = await this.getAllClusters(this.store)
//     await clusters.forEach(this.ping.bind(this))
//   }

//   start() {
//     logger.info('Starting cluster status job')
//     this.job = Scheduler.scheduleJob('cluster_inquiery', '*/10 * * * *', () => {
//       this.run()
//     })
//   }
// }

// module.exports = { TrackClusterStatus }

/*
  old ping function
  async ping_working(cluster) {
    let clusterKubectl

    if (this.test === true) {
      // mode == 'test' ???
      clusterKubectl = new this.ClusterKubectl(cluster)
    } else {
      clusterKubectl = await this.clusterKubectl({ cluster, store: this.store })
    }

    try {
      const namespaces = await clusterKubectl.getNamespaces()
      console.log('namespaces', namespaces)
      console.log('cluster.status', cluster.status)

      if (namespaces && cluster.status !== CLUSTER_STATUS.provisioned) {
        console.log('in the first if')
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.provisioned)
      }

      if (!namespaces && cluster.status === CLUSTER_STATUS.provisioned) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
        console.log('in the second if')
      }
      console.log(`namespaces2: ${namespaces}`)
      console.log(`cluster.status2: ${cluster.status}`)
    } catch (e) {
      if (cluster.status !== CLUSTER_STATUS.error) {
        console.log('in the catch block')
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
      }
    }
  }

*/

const Scheduler = require('node-schedule')
const { date } = require('yup')
const logger = require('../logging').getLogger({
  name: 'jobs/ClusterStatus',
})

const { CLUSTER_STATUS } = require('../config')
const ProductionClusterKubectl = require('../utils/clusterKubectl')

class ClusterStatusTracker {
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

module.exports = { ClusterStatusTracker }
