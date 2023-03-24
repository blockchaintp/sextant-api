/* eslint-disable camelcase */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import { Store } from '../../store'
import { DatabaseIdentifier } from '../../store/model/scalar-types'
import { decode } from '../../utils/base64'
import { deploymentToHelmRelease } from '../../utils/deploymentNames'

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
  let connection: CachedConnection | undefined = undefined
  if (connectionCacheId) {
    connection = cachedConnections[connectionCacheId]
    if (connection) {
      return connection
    }
  }

  const deployment = await store.deployment.get({
    id,
  })

  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })

  const { applied_state } = deployment

  const modelRelease = deploymentToHelmRelease(deployment)

  const { namespace } = modelRelease

  const tokenSecret = await store.clustersecret.get({
    cluster: cluster.id,
    id: cluster.desired_state.token_id as number,
  })

  const caSecret = await store.clustersecret.get({
    cluster: cluster.id,
    id: cluster.desired_state.ca_id as number,
  })

  const apiServer = cluster.desired_state.apiServer as string

  const token_dec = tokenSecret ? decode(tokenSecret.base64data).toString() : ''
  const ca_dec = caSecret ? decode(caSecret.base64data).toString() : ''
  const baseUrl = `${apiServer}/api/v1/namespaces/${namespace}`

  connection = {
    token: token_dec,
    apiServer,
    baseUrl,
    ca: ca_dec,
    namespace,
    applied_state,
  }

  if (onConnection) {
    await onConnection(connection)
  }

  if (connectionCacheId) {
    cachedConnections[connectionCacheId] = connection

    // keep cached connections for 5 mins
    // this is to avoid doing multiple database + kubectl for each request
    setTimeout(() => {
      delete cachedConnections[connectionCacheId]
    }, 1000 * 60 * 5)
  }

  return connection
}
