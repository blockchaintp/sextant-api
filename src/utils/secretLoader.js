/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const getField = require('../deployment_templates/getField')
const ClusterKubectl = require('./clusterKubectl')

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

  const {
    deployment_type,
    deployment_version,
    applied_state,
  } = deployment

  const namespace = getField({
    deployment_type,
    deployment_version,
    data: applied_state,
    field: 'namespace',
  })

  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })

  const getSecret = async (name) => {
    return clusterKubectl
      .jsonCommand(`-n ${namespace} get secret ${name}`)
  }

  return {
    getSecret,
  }
}

module.exports = SecretLoader
