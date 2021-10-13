/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const deploymentNames = require('./deploymentNames')
const ClusterKubectl = require('./clusterKubectl')
const base64 = require('./base64')

const cachedConnections = {}

// an axios instance with authentication and pointing to the deployment namespace
const deploymentConnection = async ({
  store,
  id,
  onConnection,
}) => {
  let connection = cachedConnections[id]

  if (!connection) {
    const deployment = await store.deployment.get({
      id,
    })

    const cluster = await store.cluster.get({
      id: deployment.cluster,
    })

    const {
      applied_state,
    } = deployment

    const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

    const {
      namespace,
    } = modelRelease

    const clusterKubectl = await ClusterKubectl({
      cluster,
      store,
    })

    const {
      apiServer,
      token_enc,
      ca_enc,
    } = clusterKubectl.remoteCredentials
    const token = base64.decode(token_enc)
    const ca = base64.decode(ca_enc)
    const baseUrl = `${apiServer}/api/v1/namespaces/${namespace}`

    cachedConnections[id] = {
      token,
      apiServer,
      baseUrl,
      ca,
      namespace,
      applied_state,
    }
    connection = cachedConnections[id]

    if (onConnection) {
      await onConnection(connection)
    }

    // keep cached connections for 5 mins
    // this is to avoid doing multiple database + kubectl for each request
    setTimeout(() => {
      delete (cachedConnections[id])
    }, 1000 * 60 * 5)
  }

  return connection
}

module.exports = deploymentConnection
