/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const logger = require('../logging').getLogger({
  name: 'utils/deploymentPodProxy',
})
const getField = require('../deployment_templates/getField')
const ClusterKubectl = require('./clusterKubectl')

const ProxyRequest = async ({
  kubectl,
  namespace,
  pod,
  port,
  handler,
}) => {
  if (!pod) throw new Error('A running pod is required for a proxy request.')
  const portForward = await kubectl.portForward({
    namespace,
    pod,
    port,
  })
  try {
    logger.info({
      action: 'executing handler',
      port: portForward.port,
    })
    const result = await handler({
      port: portForward.port,
    })
    logger.info({
      action: 'stopping proxy',
      port: portForward.port,
    })
    await portForward.stop()
    return result
  } catch (err) {
    logger.info({
      action: 'stopping proxy',
      port: portForward.port,
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
    .then((data) => {
      const allPods = data.items
      const runningPods = allPods.filter((pod) => {
        let running = true
        const { containerStatuses } = pod.status
        containerStatuses.forEach((container) => {
          if (container.state.running) {
            logger.info({
              action: 'filtering container statuses',
              status: `Container ${container.image} is running`,
            })
          } else { running = false }
        })
        return running
      })
      return runningPods
    })

  const getPod = async () => {
    const pods = await getPods()
    return pods && pods.length > 0 ? pods[0] : null
  }

  return {
    getPods,
    getPod,
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
    }),
  }
}

module.exports = DeploymentPodProxy
