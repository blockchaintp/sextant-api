/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const logger = require('../logging').getLogger({
  name: 'utils/deploymentPodProxy',
})
const deploymentNames = require('./deploymentNames')
const ClusterKubectl = require('./clusterKubectl').default

const ProxyRequest = async ({ kubectl, namespace, pod, port, handler }) => {
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

const DeploymentPodProxy = async ({ store, id, labelPattern = 'app.kubernetes.io/instance=<name>' }) => {
  const deployment = await store.deployment.get({
    id,
  })

  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })

  const modelRelease = deploymentNames.deploymentToHelmRelease(deployment)

  const { name, namespace } = modelRelease

  const clusterKubectl = await ClusterKubectl({
    cluster,
    store,
  })

  const useLabel = labelPattern.replace('<name>', name)

  const getPods = () =>
    clusterKubectl.getPods(namespace, { labelSelector: useLabel }).then((data) => {
      const allPods = data.items
      return allPods.filter((pod) => {
        const readyConditions = pod.status.conditions.filter((item) => item.type === 'Ready')
        if (readyConditions && readyConditions.length > 0) {
          return readyConditions.every((condition) => condition.status === 'True')
        }
        return false
      })
    })

  return {
    getPods,
    request: ({ pod, port, handler }) =>
      ProxyRequest({
        kubectl: clusterKubectl,
        namespace,
        pod,
        port,
        handler,
      }),
  }
}

module.exports = DeploymentPodProxy
