const config = require('../../config')

const {
  DEPLOYMENT_STATUS,
} = config

// eslint-disable-next-line no-empty-pattern
const ClusterDelete = ({}) => function* clusterCreateTask(params) {
  const {
    store,
    task,
    trx,
  } = params

  // get a list of deployments for this cluster and check they are all in deleted status
  const deployments = yield store.deployment.list({
    cluster: task.resource_id,
    deleted: true,
  }, trx)

  const nonDeletedDeployments = deployments.filter((deployment) => deployment.status !== DEPLOYMENT_STATUS.deleted)

  if (nonDeletedDeployments.length > 0) throw new Error('all deployments for this cluster must be in deleted state')
}

module.exports = ClusterDelete
