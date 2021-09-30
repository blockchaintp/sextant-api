const Promise = require('bluebird')

const ClusterKubectl = require('../utils/clusterKubectl')
const getField = require('../deployment_templates/getField')

const getDeployments = async (store) => {
  const deployments = await store.deployment.list({
    cluster: 'all',
    deleted: true,
  })
  return deployments
}

const executeHelmCommand = async (configuredClusterKubectl, command) => {
  try {
    const helmStatus = await configuredClusterKubectl.helmCommand(command)
    return JSON.parse(helmStatus)
  } catch (error) {
    return {
      status: 'error',
      error,
    }
  }
}

const getHelmList = async (deployment, store) => {
  const namespace = getField({
    deployment_type: deployment.deployment_type,
    deployment_version: deployment.deployment_version,
    data: deployment.desired_state,
    field: 'namespace',
  })
  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })
  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })
  // helm list -n <namespace>
  // returns one entry per chart in namespace
  const command = `list -n ${namespace} -o json`
  const helmStatus = await Promise.resolve(executeHelmCommand(clusterKubectl, command))
  return helmStatus
}

const translateStatus = (helmStatus) => {
  switch (helmStatus) {
    case 'unknown':
      return undefined
    case 'deployed':
      return 'provisioned'
    case 'uninstalled':
      return 'deleted'
    case 'superseded':
      return 'provisioned'
    case 'failed':
      return 'error'
    case 'uninstalling':
      return 'deleted'
    case 'pending-install':
      return 'provisioned'
    case 'pending-upgrade':
      return 'provisioned'
    case 'pending-rollback':
      return 'provisioned'
    case 'error':
      return 'error'
    default:
      console.log(`Sorry, there is no match for the helm status ${helmStatus}.`);
      return undefined
  }
}

const processHelmStatus = (helmStatus, deployment) => {
  // add good info to the helmStatus
  const processedHelmStatus = { helm_response: helmStatus }
  processedHelmStatus.name = deployment.name
  processedHelmStatus.cluster_id = deployment.cluster
  processedHelmStatus.status = translateStatus(helmStatus.status)
  processedHelmStatus.deployment_version = deployment.deployment_version
  processedHelmStatus.deployment_type = deployment.deployment_type
  processedHelmStatus.updated_at = new Date()
  processedHelmStatus.deployment_id = deployment.id

  return processedHelmStatus
}

const updateStatus = async (processedHelmStatus, store) => {
  await store.deployment.updateStatus({
    id: processedHelmStatus.deployment_id,
    time: processedHelmStatus.time,
    data: {
      status: processedHelmStatus.status,
      updated_at: processedHelmStatus.updated_at,
    },
  })
}

const getHelmStatuses = (deployments, store) => Promise.map(deployments, async (deployment) => {
  try {
    const helmList = await Promise.resolve(getHelmList(deployment, store))
    const helmStatus = helmList.find((release) => release.name === `${deployment.name}-${deployment.deployment_type}`)
    // TODO check to make sure the chart is correct not just the name
    const processedHelmStatus = processHelmStatus(helmStatus, deployment)
    // Update the deployment status is more recent and new
    const response = await updateStatus(processedHelmStatus, store)

    return { processedHelmStatus, response }
  } catch (error) {
    console.log('error in the getHelmStatuses function')
    console.log(error);
    return []
  }
})

const saveHelmHistory = async (processedHelmStatus, store) => {
  await store.deploymentHistory.create(processedHelmStatus)
}

module.exports = {
  getDeployments,
  translateStatus,
  processHelmStatus,
  executeHelmCommand,
  getHelmList,
  getHelmStatuses,
  updateStatus,
  saveHelmHistory,
}
