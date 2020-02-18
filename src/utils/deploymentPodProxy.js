/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const getField = require('../deployment_templates/getField')
const ClusterKubectl = require('./clusterKubectl')
const pino = require('pino')({
  name: 'deploymentPodProxy',
})

const ProxyRequest = async ({
  kubectl,
  namespace,
  pod,
  port,
  handler,
}) => {
  const portForward = await kubectl.portForward({
    namespace,
    pod,
    port,
  })
  try {
    pino.info({
      action:"executing handler",
      port: portForward.port
    })
    const result = await handler({
      port: portForward.port,
    })
    pino.info({
      action:"stopping proxy",
      port: portForward.port
    })
    await portForward.stop()
    return result
  } catch(err) {
    pino.info({
      action:"stopping proxy",
      port: portForward.port
    })
    await portForward.stop()
    throw err
  }
}

const DeploymentPodProxy = async ({
  store,
  id,
  label = 'app=<name>-validator',
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

  const networkName = getField({
    deployment_type,
    deployment_version,
    data: applied_state,
    field: 'name',
  })

  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })

  const useLabel = label.replace('<name>', networkName)

  const getPods = () => clusterKubectl
    .jsonCommand(`-n ${namespace} get po -l ${useLabel}`)
    .then(data => data.items)

  return {
    getPods,
    request: ({
      pod,
      port,
      handler,
    }) => ProxyRequest({
      kubectl: clusterKubectl,
      namespace,
      pod,
      port,
      handler,
    })
  }
}

module.exports = DeploymentPodProxy
