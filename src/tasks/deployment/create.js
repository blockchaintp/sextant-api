const Promise = require('bluebird')
const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const getField = require('../../deployment_templates/getField')
const saveAppliedState = require('./utils/saveAppliedState')
const KeyPair = require('../../utils/sextantKeyPair')

const pino = require('pino')({
  name: 'deployment.create',
})

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

  const keyPair = yield KeyPair.create({
    store,
    deployment: deployment.id,
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

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: desired_state,
    field: 'namespace',
  })

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // test we can connect to the remote cluster with the details provided
  // If the namespace exists, continue. If not, create it.
  const namespaces = yield clusterKubectl.jsonCommand('get ns')
  const existingNamespace = namespaces.items.find(namespaceItem => namespaceItem.metadata.name == namespace)

  if(!existingNamespace) yield clusterKubectl.jsonCommand(`create ns ${namespace}`)

  // If the secret exists, continue. If not, create it.
  const secretsArray = yield clusterKubectl.jsonCommand(`get secret -n ${namespace}`)
  const existingSecret = secretsArray.items.find(item => item.metadata.name == "sextant-public-key")

  if(!existingSecret) yield clusterKubectl.command(`-n ${namespace} create secret generic sextant-public-key --from-literal=publicKey=${keyPair.publicKey}`)

  const templateDirectory = yield renderTemplates({
    deployment_type,
    deployment_version,
    desired_state,
  })

  yield clusterKubectl.command(`apply -f ${templateDirectory}`)

  pino.info({
    action: 'applyTemplates',
    deployment: id,
    templateDirectory,
  })

  yield saveAppliedState({
    id,
    store,
    trx,
  })


}

module.exports = DeploymentCreate
