const Promise = require('bluebird')
const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const saveAppliedState = require('./utils/saveAppliedState')

const DeploymentCreate = ({
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

  const {
    namespace,
  } = desired_state.deployment

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // test we can connect to the remote cluster with the details provided
  const namespaces = yield clusterKubectl.jsonCommand('get ns')

  const existingNamespace = namespaces.items.find(namespaceItem => namespaceItem.metadata.name == namespace)

  if(existingNamespace) throw new Error(`there is already a namespace called ${namespace}`)

  yield clusterKubectl.jsonCommand(`create ns ${namespace}`)

  const templateDirectory = yield renderTemplates({
    deployment_type,
    deployment_version,
    desired_state,
  })

  yield clusterKubectl.command(`apply -f ${templateDirectory}`)

  yield saveAppliedState({
    id,
    store,
    trx,
  })

  
}

module.exports = DeploymentCreate