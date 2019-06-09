const Promise = require('bluebird')
const ClusterKubectl = require('../../utils/clusterKubectl')
const getField = require('../../deployment_templates/getField')

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
    applied_state,
  } = deployment

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: applied_state,
    field: 'namespace',
  })

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  yield clusterKubectl.command(`delete ns ${namespace}`)
}

module.exports = DeploymentDelete