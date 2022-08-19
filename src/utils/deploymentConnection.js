/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const deploymentNames = require('./deploymentNames')
const ClusterKubectl = require('./clusterKubectl').default
const base64 = require('./base64')

const cachedConnections = {}

// an axios instance with authentication and pointing to the deployment namespace
const deploymentConnection = async ({ store, id, onConnection, connectionCacheId }) => {
  let connection = cachedConnections[connectionCacheId]

  if (!connection) {
    const deployment = await store.deployment.get({
      id,
    })

    const cluster = await store.cluster.get({
      id: deployment.cluster,
    })

    const { applied_state: appliedState } = deployment

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const { namespace } = modelRelease

    const clusterKubectl = await ClusterKubectl({
      cluster,
      store,
    })

    const { apiServer, token, ca } = clusterKubectl.getRemoteCredentials()

    const tokenDecoded = base64.decode(token)
    const caDecoded = base64.decode(ca)
    const baseUrl = `${apiServer}/api/v1/namespaces/${namespace}`

    cachedConnections[connectionCacheId] = {
      token: tokenDecoded,
      apiServer,
      baseUrl,
      ca: caDecoded,
      namespace,
      applied_state: appliedState,
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
