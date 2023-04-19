import { CLUSTER_STATUS } from '../config'
import { getLogger } from '../logging'
import { Store } from '../store'
import { Cluster } from '../store/model/model-types'
import { Kubectl } from '../utils/kubectl'

const logger = getLogger({
  name: 'jobs/ClusterStatus',
})

export class ClusterStatusTracker {
  private store: Store

  constructor(store: Store) {
    this.store = store
  }

  async getAllClusters() {
    // get a list of all of the clusters in the database
    const clusters = await this.store.cluster.list({
      deleted: false,
    })
    logger.debug({
      fn: 'getAllClusters',
      clusters: clusters.map((cluster) => cluster.name),
    })
    return clusters
  }

  async ping(cluster: Cluster) {
    const clusterKubectl = await Kubectl.getKubectlForCluster({ cluster, store: this.store })

    try {
      const namespaces = await clusterKubectl.getNamespaces()
      if (namespaces && cluster.status === CLUSTER_STATUS.provisioned) {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.items.length,
          updatedStatus: CLUSTER_STATUS.provisioned,
          note: 'Cluster status is provisioned, no need to update.',
        })
      }

      if (namespaces && cluster.status === CLUSTER_STATUS.error) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.provisioned)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: namespaces.items.length,
          updatedStatus: CLUSTER_STATUS.provisioned,
        })
      }

      if (!namespaces && cluster.status === CLUSTER_STATUS.provisioned) {
        await this.updateClusterStatus(cluster, CLUSTER_STATUS.error)
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: 0,
          updatedStatus: CLUSTER_STATUS.error,
        })
      } else if (!namespaces) {
        logger.info({
          fn: 'ping',
          cluster: cluster.name,
          namespaces: 0,
          updatedStatus: CLUSTER_STATUS.error,
        })
        throw new Error('Cluster is not provisioned')
      }
    } catch (error: unknown) {
      logger.warn({
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

  public async run() {
    logger.info('Running cluster status job')
    const clusters = await this.getAllClusters()
    logger.debug({
      fn: 'run',
      clusters: clusters.map((cluster) => cluster.name),
    })
    for (const c of clusters) {
      await this.ping(c)
    }
  }

  async updateClusterStatus(cluster: Cluster, status: string) {
    const updatedCluster = await this.store.cluster.update({
      id: cluster.id,
      data: { status },
    })
    logger.debug({
      fn: 'updateClusterStatus',
      updatedCluster: { name: updatedCluster.name, status: updatedCluster.status },
    })
    return updatedCluster
  }
}
