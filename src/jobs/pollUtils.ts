/* eslint-disable camelcase */
import memoize = require('memoizee')
import { getLogger } from '../logging'
import { Store } from '../store'
import { Deployment } from '../store/model/model-types'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import { ClusterKubectl } from '../utils/clusterKubectl'
import { deploymentToHelmRelease } from '../utils/deploymentNames'
import { Kubectl } from '../utils/kubectl'

const logger = getLogger({
  name: 'jobs/pollUtils',
})

export const getAllDeployments = async (store: Store) => {
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

const executeHelmCommand = async (configuredClusterKubectl: Kubectl, command: string) => {
  const helmResponse = await configuredClusterKubectl.helmCommand(command)
  const parsedHelmResponse = JSON.parse(helmResponse.stdout) as unknown[]
  logger.debug({
    fn: 'executeHelmCommand',
    command,
    parsedResponse: parsedHelmResponse,
  })
  return parsedHelmResponse
}

type HelmReleaseItem = {
  app_version: string
  chart: string
  name: string
  namespace: string
  revision: string
  status: string
  updated: string
}

const runHelmList = async (deployment: Deployment, store: Store) => {
  const modelRelease = deploymentToHelmRelease(deployment)

  const { namespace } = modelRelease

  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })

  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })

  const command = `list -n ${namespace} -o json`
  return executeHelmCommand(clusterKubectl, command) as Promise<HelmReleaseItem[]>
}

const translateStatus = memoize((helmStatus: string) => {
  let translatedStatus: string
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
})

type HelmDeploymentResponse = {
  cluster_id: DatabaseIdentifier
  deployment_id: DatabaseIdentifier
  deployment_type: string
  deployment_version: string
  helmStatus: string
  helm_response: HelmReleaseItem
  name: string
  status: string
  updated_at: Date
}
const processHelmResponse = (helmResponse: HelmReleaseItem, deployment: Deployment) => {
  // returns an object full of useful information for the deployment status poll job
  const helmStatus = helmResponse ? helmResponse.status : undefined
  const translatedStatus = translateStatus(helmStatus)

  const processedHelmResponse: HelmDeploymentResponse = {
    cluster_id: deployment.cluster,
    deployment_id: deployment.id,
    deployment_type: deployment.deployment_type,
    deployment_version: deployment.deployment_version,
    helm_response: helmResponse,
    helmStatus: helmStatus,
    name: deployment.name,
    status: translatedStatus,
    updated_at: new Date(),
  }

  return processedHelmResponse
}

// Updates the deployment status in the DB, if the status is more recent AND new
const updateStatus = async (processedHelmResponse: HelmDeploymentResponse, store: Store) => {
  const databaseResponse = await store.deployment.updateStatus({
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

export const getHelmStatuses = (deployments: Deployment[], store: Store) => {
  if (!deployments) return Promise.all([])
  logger.debug({
    fn: 'getHelmStatuses',
    note: 'executes helm list for each deployment stored in the database',
    deployments,
  })
  return Promise.all(
    deployments.map(async (deployment) => {
      const helmList = await runHelmList(deployment, store)
      try {
        // returns a release with the given name
        // will be undefined if a match is not found in the helm list
        const modelRelease = deploymentToHelmRelease(deployment)

        const helmResponse = helmList.find((release) => release.name === modelRelease.name)
        logger.debug({ fn: 'getHelmStatuses', message: 'selected helmResponse', helmResponse })
        const processedHelmResponse = processHelmResponse(helmResponse, deployment)
        await updateStatus(processedHelmResponse, store)
        return processedHelmResponse
      } catch (err: unknown) {
        logger.warn({
          fn: 'getHelmStatuses',
          deployment: deployment.name,
          error: err,
        })
        return {
          cluster_id: deployment.cluster,
          deployment_id: deployment.id,
          deployment_type: deployment.deployment_type,
          deployment_version: deployment.deployment_version,
          helm_response: undefined,
          helmStatus: undefined,
          name: deployment.name,
          status: 'error',
          updated_at: new Date(),
        }
      }
    })
  )
}
