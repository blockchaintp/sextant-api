const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const { getCharts, getChartsFolder } = require('../../deployment_templates/helmRender')
const getField = require('../../deployment_templates/getField')
const saveAppliedState = require('./utils/saveAppliedState')

const pino = require('pino')({
  name: 'deployment.update',
})

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

  const appliedNetworkName = getField({
    deployment_type,
    deployment_version,
    data: applied_state,
    field: 'name',
  })

  // check that the user is not trying to change the k8s namespace
  if(appliedNamespace && desiredNamespace != appliedNamespace) {
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
  if (charts) {
    const chartsFolder = getChartsFolder({
      deployment_type,
      deployment_version,
    })

    charts.forEach(
      yield (chartFile) => {
        let safeFileName = makeSafeFileName(chartFile)
        console.log(`Applying chart ${chartsFolder}/${chartFile} to ns ${appliedNamespace} with name ${appliedNetworkName}-${safeFileName}`)
        clusterKubectl.helmCommand(`-n ${appliedNamespace} install ${appliedNetworkName}-${safeFileName} ${chartsFolder}/${chartFile} || true`)
    })
  }

  yield clusterKubectl.command(`apply -f ${templateDirectory}`)

  pino.info({
    action: 'applyTemplates',
    deployment: id,
    templateDirectory,
  })

  yield saveAppliedState({
    id,
    store,
    trx
  })
}

module.exports = DeploymentUpdate
