/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const Promise = require('bluebird')
const fs = require('fs')

const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const { getCharts, getChartsFolder } = require('../../deployment_templates/helmRender')
const getField = require('../../deployment_templates/getField')
const saveAppliedState = require('./utils/saveAppliedState')
const KeyPair = require('../../utils/sextantKeyPair')
const { getChartInfo } = require('./utils/helmUtils')
const { writeValues } = require('../../deployment_templates/writeValues')



const readdir = Promise.promisify(fs.readdir)

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
    custom_yaml,
    deployment_method
  } = deployment

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: desired_state,
    field: 'namespace',
  })

  const networkName = getField({
    deployment_type,
    deployment_version,
    data: desired_state,
    field: 'name',
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

  // if the deploymentMethod is helm, use helm to create deployment, otherwise use the deployment templates directory
  if (deployment_method === 'helm') {

    const chartInfo = yield getChartInfo(deployment_type, deployment_version)

    const chart = chartInfo.chart 
    const extension = chartInfo.extension
    const installationName = `${networkName}-${extension}`
    const valuesPath = yield writeValues({ desired_state, custom_yaml})

    yield clusterKubectl.helmCommand(`-n ${namespace} install ${installationName} -f ${valuesPath} ${chart}`)

  } else {

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
      deployment_version
    })

    const makeSafeFileName = (chartFile) => {
      const safeFileName = chartFile.match(/[a-z]([-a-z0-9]*[a-z])*/)[0]
      return safeFileName
    }

    // if there is a charts directory, do a helm command for each chart
    //      yield clusterKubectl.helmCommand(`-n ${namespace} install ${networkName}-${makeSafeName(chartFile)} ${chartFile}`
    pino.info({
      action: "charts",
      charts
    })

    if (charts) {
      const chartsFolder = getChartsFolder({
        deployment_type,
        deployment_version,
      })

      charts.forEach(
        yield (chartFile) => {
          let safeFileName = makeSafeFileName(chartFile)
          pino.info({
            action: "Applying chart",
            chartFolder,
            chartFile,
            namespace,
            networkName,
            safeFileName
          })
          clusterKubectl.helmCommand(`-n ${namespace} install ${networkName}-${safeFileName} ${chartsFolder}/${chartFile}`)
        })
    }

    yield clusterKubectl.command(`apply -f ${templateDirectory}`)

    pino.info({
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

module.exports = DeploymentCreate
