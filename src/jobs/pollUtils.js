/* eslint-disable max-len */
const Promise = require('bluebird')
const deploymentNames = require('../utils/deploymentNames')
const logger = require('../logging').getLogger({
  name: 'jobs/pollUtils',
})

const ClusterKubectl = require('../utils/clusterKubectl')
const getField = require('../deployment_templates/getField')

const getAllDeployments = async (store) => {
  const deployments = await store.deployment.list({
    cluster: 'all',
    deleted: true,
  })

  logger.debug({
    fn: 'getAllDeployments',
    deployments,
  })
  return deployments
}

const executeHelmCommand = async (configuredClusterKubectl, command) => {
  try {
    const helmResponse = await configuredClusterKubectl.helmCommand(command)
    const parsedHelmResponse = JSON.parse(helmResponse)
    logger.debug({
      fn: 'executeHelmCommand',
      command,
      parsedResponse: parsedHelmResponse.map((response) => ({
        name: response.name,
        namespace: response.namespace,
        status: response.status,
      })),
    })
    return parsedHelmResponse
  } catch (error) {
    return {
      status: 'error',
      error,
    }
  }
}

const runHelmList = async (deployment, store) => {
  // returns a list of the active helm deployments in a given namespace
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

  const command = `list -n ${namespace} -o json`
  logger.debug({
    action: `running helm list command on ${deployment.name} deployment`,
  })
  return Promise.resolve(executeHelmCommand(clusterKubectl, command))
}

const translateStatus = (helmStatus) => {
  let translatedStatus
  switch (helmStatus) {
    case undefined:
      translatedStatus = 'deleted'
      break
    case 'unknown':
      logger.warn({
        fn: 'translateStatus',
        warning: "The helm status is 'unknown'.",
      })
      translatedStatus = undefined
      break
    case 'deployed':
      translatedStatus = 'provisioned'
      break
    case 'uninstalled':
      translatedStatus = 'deleted'
      break
    case 'superseded':
      translatedStatus = 'provisioned'
      break
    case 'failed':
      translatedStatus = 'error'
      break
    case 'uninstalling':
      translatedStatus = 'deleted'
      break
    case 'pending-install':
      translatedStatus = 'provisioned'
      break
    case 'pending-upgrade':
      translatedStatus = 'provisioned'
      break
    case 'pending-rollback':
      translatedStatus = 'provisioned'
      break
    case 'error':
      translatedStatus = 'error'
      break
    default:
      logger.warn({
        fn: 'translateStatus',
        warning: `There is no match for the helm status ${helmStatus}.`,
      })
      translatedStatus = undefined
  }
  logger.trace({
    fn: 'translateStatus',
    helmStatus,
    translatedStatus,
    message: `${helmStatus} translated to ${translatedStatus}`,
  })
  return translatedStatus
}

const processHelmResponse = (helmResponse, deployment) => {
  // returns an object full of useful information for the deployment status poll job
  const helmStatus = helmResponse ? helmResponse.status : undefined
  const translatedStatus = translateStatus(helmStatus)

  const processedHelmResponse = { helm_response: helmResponse }
  processedHelmResponse.name = deployment.name
  processedHelmResponse.cluster_id = deployment.cluster
  processedHelmResponse.status = translatedStatus
  processedHelmResponse.deployment_version = deployment.deployment_version
  processedHelmResponse.deployment_type = deployment.deployment_type
  processedHelmResponse.updated_at = new Date()
  processedHelmResponse.deployment_id = deployment.id

  return processedHelmResponse
}

// Updates the deployment status in the DB, if the status is more recent AND new
const updateStatus = async (processedHelmResponse, store) => {
  const databaseResponse = await store.deployment
    .updateStatus({
      id: processedHelmResponse.deployment_id,
      time: processedHelmResponse.time,
      data: {
        status: processedHelmResponse.status,
        updated_at: processedHelmResponse.updated_at,
      },
    })
  logger.debug({
    fn: 'updateStatus',
    deployment: processedHelmResponse.name,
    status: processedHelmResponse.status,
    updated: !!databaseResponse,
  })
  return databaseResponse
}

const getHelmStatuses = (deployments, store) => {
  if (!deployments) return []
  logger.debug({
    fn: 'getHelmStatuses',
    note: 'executes helm list for each deployment stored in the database',
  })
  return Promise.map(deployments, async (deployment) => {
    const helmList = await Promise.resolve(runHelmList(deployment, store))
    // returns a release with the given name
    // will be undefined if a match is not found in the helm list
    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)
    const helmResponse = helmList.find((release) => release.name === modelRelease.name)
    logger.trace({ fn: 'getHelmStatuses', message: 'selected helmResponse', helmResponse })
    const processedHelmResponse = processHelmResponse(helmResponse, deployment)
    await Promise.resolve(updateStatus(processedHelmResponse, store))
    return processedHelmResponse
  })
}

module.exports = {
  getAllDeployments,
  translateStatus,
  processHelmResponse,
  executeHelmCommand,
  runHelmList,
  getHelmStatuses,
  updateStatus,
}