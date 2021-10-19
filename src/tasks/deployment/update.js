/* eslint-disable max-len */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const logger = require('../../logging').getLogger({
  name: 'tasks/deployment/update',
})
const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const { getCharts, getChartsFolder } = require('../../deployment_templates/helmRender')
const deploymentNames = require('../../utils/deploymentNames')
const saveAppliedState = require('./utils/saveAppliedState')
const { writeValues } = require('../../deployment_templates/writeValues')
const { getChartInfo, getChartVersion } = require('./utils/helmUtils')
const KeyPair = require('../../utils/sextantKeyPair')

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

  KeyPair.getOrCreate({ store, deployment: deployment.id }, trx)

  const cluster = yield store.cluster.get({
    id: deployment.cluster,
  }, trx)

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

  // TODO: mock the kubectl handler for tests
  if (testMode) {
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

  // test we can connect to the remote cluster with the details provided
  // If the namespace exists, continue. If not, create it.
  const namespaces = yield clusterKubectl.getNamespaces()
  const existingNamespace = namespaces.items.find((namespaceItem) => namespaceItem.metadata.name === namespace)

  if (!existingNamespace) yield clusterKubectl.jsonCommand(`create ns ${namespace}`)
  /*
  If this is a sawtooth deployment, use the helm chart to update the deployment on the cluster
  otherwise, use the template directory
  */

  if (deployment_method === 'helm') {
    const chartInfo = yield getChartInfo(deployment_type, deployment_version)
    const chartversion = yield getChartVersion(deployment_type, deployment_version)

    const { chart } = chartInfo
    const installationName = `${name}`
    const valuesPath = yield writeValues({ desired_state, custom_yaml })

    const useChart = process.env.USE_LOCAL_CHARTS ? `/app/api/helmCharts/${chart.split('/')[1]}` : chart

    // if the chart is installed, upgrade it. Otherwise, install it
    yield clusterKubectl.helmCommand(`-n ${namespace} upgrade ${installationName} -f ${valuesPath} ${useChart} --install --version ${chartversion}`)
  } else {
    const templateDirectory = yield renderTemplates({
      deployment_type,
      deployment_version,
      desired_state,
      custom_yaml,
    })

    const charts = yield getCharts({
      deployment_type,
      deployment_version,
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
            name,
          })
          clusterKubectl.helmCommand(`-n ${namespace} install ${name} ${chartsFolder}/${chartFile} || true`)
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

  yield saveAppliedState({
    id,
    store,
    trx,
  })
}

module.exports = DeploymentUpdate
