const getField = require('../deployment_templates/getField')
const ClusterKubectl = require('./clusterKubectl')

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
    const result = await handler({
      port: portForward.port,
    })
    await portForward.stop()
    return result
  } catch(err) {
    await portForward.stop()
    throw err
  }
}

const DeploymentPodProxy = async ({
  store,
  id,
  label = 'app=<namespace>-validator',
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

  const useLabel = label.replace('<namespace>', namespace)

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