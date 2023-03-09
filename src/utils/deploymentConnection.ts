/* eslint-disable camelcase */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import { Store } from '../store'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import * as base64 from './base64'
import { ClusterKubectl } from './clusterKubectl'
import * as deploymentNames from './deploymentNames'

export type CachedConnection = {
  apiServer: string
  applied_state: unknown
  baseUrl: string
  ca: string
  namespace: string
  token: string
}
const cachedConnections: {
  [key in string]: CachedConnection
} = {}

// an axios instance with authentication and pointing to the deployment namespace
export const deploymentConnection = async ({
  store,
  id,
  onConnection,
  connectionCacheId,
}: {
  connectionCacheId?: string
  id: DatabaseIdentifier
  onConnection?: (connection: CachedConnection) => Promise<void>
  store: Store
}) => {
  let connection = cachedConnections[connectionCacheId]

  if (!connection) {
    const deployment = await store.deployment.get({
      id,
    })

    const cluster = await store.cluster.get({
      id: deployment.cluster,
    })

    const { applied_state } = deployment

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { namespace } = modelRelease

    const clusterKubectl = await ClusterKubectl({
      cluster,
      store,
    })

    const { apiServer, token, ca } = clusterKubectl.getRemoteCredentials()

    const token_dec = base64.decode(token).toString()
    const ca_dec = base64.decode(ca).toString()
    const baseUrl = `${apiServer}/api/v1/namespaces/${namespace}`

    cachedConnections[connectionCacheId] = {
      token: token_dec,
      apiServer,
      baseUrl,
      ca: ca_dec,
      namespace,
      applied_state,
    }
    connection = cachedConnections[connectionCacheId]

    if (onConnection) {
      await onConnection(connection)
    }

    // keep cached connections for 5 mins
    // this is to avoid doing multiple database + kubectl for each request
    setTimeout(() => {
      delete cachedConnections[connectionCacheId]
    }, 1000 * 60 * 5)
  }

  return connection
}

module.exports = deploymentConnection
