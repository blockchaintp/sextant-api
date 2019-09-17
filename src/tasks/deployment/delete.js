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

  const interceptError = async () => {
    try {
      // try to connect to a remote cluster and delete it
      await clusterKubectl.command(`delete ns ${namespace}`)
    } catch (err) {
      // read the error, if it's NOT a server error - then throw an error
      // status will be set to error
      // otherwise ignore the error and let the status be set to delete
      const match = err.message.match(/Unable to connect to the server/g)
      if (match[0] !== 'Unable to connect to the server') {
        throw err
      }
    }
  }

  yield interceptError()

}

module.exports = DeploymentDelete
