/* eslint-disable import/order */
const ClusterKubectl = require('../../utils/clusterKubectl')
const renderTemplates = require('../../deployment_templates/render')
const getField = require('../../deployment_templates/getField')
const { getChartInfo } = require('./utils/helmUtils')

const {
  CLUSTER_STATUS,
} = require('../../config')

const pino = require('pino')({
  name: 'deployment.delete',
})

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

  if (testMode) {
    return
  }

  const {
    deployment_method,
    deployment_type,
    deployment_version,
    desired_state,
    applied_state,
    custom_yaml,
    status,
  } = deployment

  // if the deployment is in error state - use the
  // desired state to pick the namespace as it might
  // not have any applied_state having errored
  const useData = status === CLUSTER_STATUS.error
    ? desired_state
    : applied_state

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: useData,
    field: 'namespace',
  })

  const networkName = getField({
    deployment_type,
    deployment_version,
    data: useData,
    field: 'name',
  })

  const clusterKubectl = yield ClusterKubectl({
    cluster,
    store,
  })

  const deleteTheRest = async () => {
    try {
      await clusterKubectl.command(`delete configmap validator-public -n ${namespace} || true`)
      // delete stacks if they are there
    } catch (err) {
      // read the error, if it's NOT a server error - then throw an error
      // status will be set to error
      // otherwise ignore the error and let the status be set to delete
      const match = err.message.match(/Unable to connect to the server/g) || err.message.match(/Error from server \(NotFound\): namespaces/g)
      if (match === null) {
        throw err
      }
    }
  }

  // delete helm chartsFolder
  // list all of the charts
  // helm list -n <namespace> -q
  // uninstall the charts listed
  // helm uninstall -n <namespace>

  const deleteHelmChartsInNamespace = async () => {
    try {
      const chartOut = await clusterKubectl.helmCommand(`list -n ${namespace} -q`)
      // re-format the return of list - it is probably a string with "\n' seperators
      const chartList = chartOut.replace(/\n/g, ' ').split(' ')
      pino.info({
        action: 'deleteHelmChartsInNamespace',
        chartList,
      })

      chartList.forEach(async (chart) => {
        if (chart) {
          pino.info({
            action: 'removing chart',
            chart,
            namespace,
          })
          await clusterKubectl.helmCommand(`uninstall -n ${namespace} ${chart}`)
        }
      })
    } catch (err) {
      pino.info({
        action: 'deleteHelmChartsInNamespace',
        message: 'benign if there are no helm charts to delete',
        err,
      })
    }
  }

  const deleteHelmChart = async (chartInfo, name, namespaceName) => {
    const { extension } = chartInfo
    const installationName = `${name}-${extension}`
    await clusterKubectl.helmCommand(`uninstall -n ${namespaceName} ${installationName}`)
  }

  if (deployment_method === 'helm') {
    const chartInfo = yield getChartInfo(deployment_type, deployment_version)
    yield deleteHelmChart(chartInfo, networkName, namespace)
  } else {
    // function expects arg named desired_state,
    // but we will use applied_state if there is no error status
    // because we are deleting not creating
    const templateDirectory = yield renderTemplates({
      deployment_type,
      deployment_version,
      desired_state: useData,
      custom_yaml,
    })

    const deleteDirectory = async () => {
      try {
        await clusterKubectl.command(`delete -f ${templateDirectory}`)
      } catch (err) {
        // read the error, if it's NOT a server error - then throw an error
        // status will be set to error
        // otherwise ignore the error and let the status be set to delete
        const match = err.message.match(/Unable to connect to the server/g) || err.message.match(/Error from server \(NotFound\): namespaces/g)
        if (match === null) {
          throw err
        }
      }
    }

    yield deleteDirectory()
    yield deleteHelmChartsInNamespace()
  }

  yield deleteTheRest()
}

module.exports = DeploymentDelete
