const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const getField = require('../../deployment_templates/getField')
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

  const {
    deployment_type,
    deployment_version,
    applied_state,
    desired_state,
  } = deployment

  const desiredNamespace = getField({
    deployment_type,
    deployment_version,
    data: desired_state,
    field: 'namespace',
  })

  const appliedNamespace = getField({
    deployment_type,
    deployment_version,
    data: applied_state,
    field: 'namespace',
  })

  // check that the user is not trying to change the k8s namespace
  if(desiredNamespace != appliedNamespace) {
    throw new Error(`you cannot change the namespace of a deployment`)
  }

  // TODO: mock the kubectl handler for tests
  if(testMode) {
    yield saveAppliedState({
      id,
      store,
      trx,
    })

    return
  }

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  const templateDirectory = yield renderTemplates({
    deployment_type,
    deployment_version,
    desired_state,
  })

  yield clusterKubectl.command(`apply -f ${templateDirectory}`)

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = DeploymentUpdate