const Promise = require('bluebird')
const ClusterKubectl = require('../../utils/clusterKubectl')

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
    applied_state,
  } = deployment

  const {
    namespace,
  } = applied_state.deployment

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  yield clusterKubectl.command(`delete ns ${namespace}`)
}

module.exports = DeploymentDelete