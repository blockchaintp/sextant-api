/* eslint-disable max-len */
const logger = require('../../logging').getLogger({
  name: 'tasks/deployment/create',
})
const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const { getCharts, getChartsFolder } = require('../../deployment_templates/helmRender')
const deploymentNames = require('../../utils/deploymentNames')
const saveAppliedState = require('./utils/saveAppliedState')
const KeyPair = require('../../utils/sextantKeyPair')
const { getChartInfo, getChartVersion } = require('./utils/helmUtils')
const { writeValues } = require('../../deployment_templates/writeValues')

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
  if (testMode) {
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
    custom_yaml,
    deployment_method,
  } = deployment

  const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

  const {
    name,
    namespace,
  } = modelRelease

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  // if the deploymentMethod is helm, use helm to create deployment, otherwise use the deployment templates directory
  if (deployment_method === 'helm') {
    const chartInfo = yield getChartInfo(deployment_type, deployment_version)
    const chartversion = yield getChartVersion(deployment_type, deployment_version)
    const { chart } = chartInfo
    const installationName = `${name}`
    const valuesPath = yield writeValues({ desired_state, custom_yaml })
    const useChart = process.env.USE_LOCAL_CHART ? process.env.USE_LOCAL_CHART : chart
    yield clusterKubectl.helmCommand(`-n ${namespace} install --create-namespace ${installationName} -f ${valuesPath} ${useChart} --version ${chartversion}`)
  } else {
    // test we can connect to the remote cluster with the details provided
    // If the namespace exists, continue. If not, create it.
    const namespaces = yield clusterKubectl.getNamespaces()
    const existingNamespace = namespaces.items.find((namespaceItem) => namespaceItem.metadata.name === namespace)

    if (!existingNamespace) yield clusterKubectl.jsonCommand(`create ns ${namespace}`)

    const templateDirectory = yield renderTemplates({
      deployment_type,
      deployment_version,
      desired_state,
      custom_yaml,
    })

    // templateDirectory is src/deployment_templates/{deployment_type}/{deployment_version}
    // for each file in ${templateDirectory}/charts/*.tgz
    // yield clusterKubectl.helmCommand(`-n ${namespace} install <someName>-<theChartfile> -f <theChartFile>.tgz `)

    const charts = yield getCharts({
      deployment_type,
      deployment_version,
    })

    logger.trace({
      action: 'charts',
      charts,
    })

    if (charts) {
      const chartsFolder = getChartsFolder({
        deployment_type,
        deployment_version,
      })

      charts.forEach(
        yield (chartFile) => {
          logger.info({
            action: 'Applying chart',
            chartFile,
            namespace,
            name,
          })
          clusterKubectl.helmCommand(`-n ${namespace} install ${name} ${chartsFolder}/${chartFile}`)
        },
      )
    }

    yield clusterKubectl.command(`apply -f ${templateDirectory}`)

    logger.info({
      action: 'applyTemplates',
      deployment: id,
      templateDirectory,
    })
  }

  // If the secret exists, continue. If not, create it.
  const secretsArray = yield clusterKubectl.getSecrets(namespace)
  const existingSecret = secretsArray.items.find((item) => item.metadata.name === 'sextant-public-key')
  if (!existingSecret) yield clusterKubectl.command(`-n ${namespace} create secret generic sextant-public-key --from-literal=publicKey=${keyPair.publicKey}`)

  yield saveAppliedState({
    id,
    store,
    trx,
  })
}

module.exports = DeploymentCreate
