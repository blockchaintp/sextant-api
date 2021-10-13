/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const ClusterKubectl = require('./clusterKubectl')
const deploymentNames = require('./deploymentNames')

const SecretLoader = async ({
  store,
  id,
}) => {
  const deployment = await store.deployment.get({
    id,
  })

  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })

  const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

  const {
    namespace,
  } = modelRelease

  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })

  const getSecret = async (name) => clusterKubectl.jsonCommand(`-n ${namespace} get secret ${name}`)

  return {
    getSecret,
  }
}

module.exports = SecretLoader
