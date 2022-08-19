/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const ClusterKubectl = require('../utils/clusterKubectl').default
const deploymentNames = require('../utils/deploymentNames')

const SecretLoader = async ({ store, id }) => {
  const deployment = await store.deployment.get({
    id,
  })

  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })

  const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

  const { namespace } = modelRelease

  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })

  const getSecret = (name) => clusterKubectl.getSecretByName(namespace, name)

  return {
    getSecret,
  }
}

module.exports = SecretLoader
