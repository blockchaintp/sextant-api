/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import { StoreType } from '../store'
import { AppliedState, DatabaseIdentifier } from '../store/domain-types'
import { decode } from './base64'
import ClusterKubectl from './clusterKubectl'
import deploymentNames from './deploymentNames'
import { KubectlRemoteCredentials } from './kubectl'

export type DeploymentConnection = KubectlRemoteCredentials & {
  baseUrl: string
  namespace: string
  appliedState: AppliedState
}

const cachedConnections: {
  [key in string]: DeploymentConnection
} = {}

export type DeploymentConnectionArgs = {
  store: StoreType
  id: DatabaseIdentifier
  connectionCacheId: string
}
// an axios instance with authentication and pointing to the deployment namespace
const deploymentConnection = async ({ store, id, connectionCacheId }: DeploymentConnectionArgs) => {
  let connection = cachedConnections[connectionCacheId]

  if (!connection) {
    const deployment = await store.deployment.get({
      id,
    })
    if (!deployment) {
      throw new Error(`Deployment not found: ${id}`)
    }

    const cluster = await store.cluster.getNatural({
      id: deployment.cluster,
    })
    if (!cluster) {
      throw new Error(`Cluster not found: ${deployment.cluster}`)
    }

    const { applied_state: appliedState } = deployment

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { namespace } = modelRelease

    const clusterKubectl = await ClusterKubectl({
      cluster,
      store,
    })

    const { apiServer, token, ca } = clusterKubectl.getRemoteCredentials()

    const tokenDecoded = decode(token).toString()
    const caDecoded = decode(ca)
    const baseUrl = `${apiServer}/api/v1/namespaces/${namespace}`

    cachedConnections[connectionCacheId] = {
      token: tokenDecoded,
      apiServer,
      baseUrl,
      ca: caDecoded.toString(),
      namespace,
      appliedState,
    }
    connection = cachedConnections[connectionCacheId]

    // keep cached connections for 5 mins
    // this is to avoid doing multiple database + kubectl for each request
    setTimeout(() => {
      delete cachedConnections[connectionCacheId]
    }, 1000 * 60 * 5)
  }

  return connection
}

export default deploymentConnection
