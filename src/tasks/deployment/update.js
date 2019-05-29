const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const saveAppliedState = require('./utils/saveAppliedState')

const DeploymentUpdate = ({
  testMode,
}) => function* deploymentUpdateTask(params) {
  
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

  // TODO: mock the kubectl handler for tests
  if(testMode) {
    yield saveAppliedState({
      id,
      store,
      trx,
    })

    return
  } 

  const {
    deployment_type,
    deployment_version,
    desired_state,
  } = deployment

  const templateDirectory = yield renderTemplates({
    deployment_type,
    deployment_version,
    desired_state,
  })

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // test we can connect to the remote cluster with the details provided
  yield clusterKubectl.jsonCommand('get ns')

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = DeploymentUpdate