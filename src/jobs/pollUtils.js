/* eslint-disable max-len */
const Promise = require('bluebird')
const memoize = require('memoizee');
const deploymentNames = require('../utils/deploymentNames')
const logger = require('../logging').getLogger({
  name: __filename,
})

const ClusterKubectl = require('../utils/clusterKubectl');
const { DEPLOYMENT_STATUS } = require('../config');

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
  const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

  const {
    namespace,
  } = modelRelease

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

const translateStatus = memoize((helmStatus) => {
  let translatedStatus
  switch (helmStatus) {
    case 'unknown':
      logger.warn({
        fn: 'translateStatus',
        warning: "The helm status is 'unknown'.",
      })
      translatedStatus = undefined
      break
    case 'deployed':
    case 'superseded':
    case 'pending-install':
    case 'pending-upgrade':
    case 'pending-rollback':
      translatedStatus = DEPLOYMENT_STATUS.provisioned
      break
    case 'failed':
      translatedStatus = DEPLOYMENT_STATUS.error
      break
    case undefined:
    case 'uninstalled':
    case 'uninstalling':
      translatedStatus = DEPLOYMENT_STATUS.deleted
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
})

const processHelmResponse = (helmResponse, deployment) => {
  // returns an object full of useful information for the deployment status poll job
  const helmStatus = helmResponse ? helmResponse.status : undefined
  const translatedStatus = translateStatus(helmStatus)

  const processedHelmResponse = { helm_response: helmResponse }
  processedHelmResponse.helmStatus = helmStatus
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
      helm_response: processedHelmResponse.helm_response,
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
  processHelmResponse,
  executeHelmCommand,
  runHelmList,
  getHelmStatuses,
  updateStatus,
}
