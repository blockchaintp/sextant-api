/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
import { getLogger } from '../logging'
import { Store } from '../store'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import { ClusterKubectl } from './clusterKubectl'
import { deploymentToHelmRelease } from './deploymentNames'
import { Kubectl } from './kubectl'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: 'utils/deploymentPodProxy',
})

const ProxyRequest = async ({
  kubectl,
  namespace,
  pod,
  port,
  handler,
}: {
  handler: (args: { port: number }) => Promise<unknown>
  kubectl: Kubectl
  namespace: string
  pod: string
  port: number
}) => {
  if (!pod) throw new Error('A running pod is required for a proxy request.')
  const portForward = await kubectl.portForward({
    namespace,
    pod,
    port,
  })
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      action: 'executing handler',
      port: portForward.port,
    })
    const result = await handler({
      port: portForward.port,
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      action: 'stopping proxy',
      port: portForward.port,
    })

    portForward.stop()
    return result
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.info({
      action: 'stopping proxy',
      port: portForward.port,
    })
    portForward.stop()
    throw err
  }
}

export const DeploymentPodProxy = async ({
  store,
  id,
  labelPattern = 'app.kubernetes.io/instance=<name>',
}: {
  id: DatabaseIdentifier
  labelPattern?: string
  store: Store
}) => {
  const deployment = await store.deployment.get({
    id,
  })

  const cluster = await store.cluster.get({
    id: deployment.cluster,
  })

  const modelRelease = deploymentToHelmRelease(deployment)

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
    request: ({
      pod,
      port,
      handler,
    }: {
      handler: (args: { port: number }) => Promise<unknown>
      pod: string
      port: number
    }) =>
      ProxyRequest({
        kubectl: clusterKubectl,
        namespace,
        pod,
        port,
        handler,
      }),
  }
}
