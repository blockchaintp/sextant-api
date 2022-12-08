// Periodically check on the status of the cluster and update the cluster status in the DB if it has changed.
// This will likely be a new job that will be run on a schedule.

// clusters are listed in the DB
// we will need the cluster info/credentials in order to ask kubernetes for the status
// kubectl describe? kubectl get? kubectl status?
// we may need to parse the output of the command to get the actual status
// update the cluster status in the DB if it has changed

// Are we using the kubernetes API or the kubectl command? - API

// attempt to get a list of namespaces from the cluster

// schedule.scheduleJob('*/10 * * * *'

const logger = require('../logging').getLogger({
  name: 'jobs/clusterStatus',
})
const ClusterKubectl = require('../utils/clusterKubectl')

const getAllClusters = async (store) => {
  // get a list of all of the clusters in the database
  const clusters = await store.cluster.list({
    deleted: false,
  })

  logger.debug({
    fn: 'getAllClusters',
    clusters,
  })
  return clusters
}

const defineClusterKubectl = async (cluster, store) => {
  await ClusterKubectl({
    cluster,
    store,
  })
}

const updateClusterStatus = async (cluster, store) => {
  // set the cluster as inactive (deleted?)
  const updatedCluster = await store.cluster.update({
    id: cluster.id,
    status: 'inactive',
  })

  logger.debug({
    fn: 'updateClusterStatus',
    updatedCluster: { name: updatedCluster.name, status: updatedCluster.status },
  })
  return updatedCluster
}

const pingClusters = (clusters, store) => {
  // define a new kubectl instance for each cluster in the list from the DB
  // ping for namespaces, update statuses, handle errors
  clusters.forEach(async (cluster) => {
    const clusterKubectl = await defineClusterKubectl(cluster, store)

    // if there are namespaces, the status is active
    const namespaces = await clusterKubectl.getNamespaces()

    logger.debug({
      fn: 'clusterKubectl.getNamespaces',
      namespaces,
    })

    if (!namespaces) {
      // if there are no namespaces, the status is inactive
      await updateClusterStatus(cluster, store)
    }

    // TODO handle errors
  })
}

const clusterStatus = async (store) => {
  const clusters = await getAllClusters(store)

  pingClusters(clusters, store)
}

module.exports = clusterStatus

/*

  ***** Questions *****
  - What is the best way to handle errors with promises?
  - Does pingClusters need to be async?
  - How are cluster statuses defined?
  - Is there a reason to include deleted clusters in the list of clusters?

*/
