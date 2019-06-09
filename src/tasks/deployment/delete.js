const Promise = require('bluebird')
const ClusterKubectl = require('../../utils/clusterKubectl')
const getField = require('../../deployment_templates/getField')

const {
  CLUSTER_STATUS,
} = require('../../config')

const DeploymentDelete = ({
  testMode,
}) => function* deploymentCreateTask(params) {

  const {
    store,
    task,
    trx,
  } = params

  const id = task.resource_id

  const deployment = yield store.deployment.get({
    id,
  }, trx)

  const cluster = yield store.cluster.get({
    id: deployment.cluster,
  }, trx)

  if(testMode) {
    return
  }

  const {
    deployment_type,
    deployment_version,
    desired_state,
    applied_state,
    status,
  } = deployment

  // if the deployment is in error state - use the
  // desired state to pick the namespace as it might
  // not have any applied_state having errored
  const useData = status == CLUSTER_STATUS.error ?
    desired_state :
    applied_state

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: useData,
    field: 'namespace',
  })

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  yield clusterKubectl.command(`delete ns ${namespace}`)
}

module.exports = DeploymentDelete