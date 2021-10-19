/*

  given a cluster - return a kubectl client that will connect to it

  it will load the secrets from the store if needed

*/

const Kubectl = require('./kubectl')

const ClusterKubectl = async ({
  cluster,
  store,
}) => {
  if (!cluster) throw new Error('cluster required for ClusterKubectl')
  if (!store) throw new Error('store required for ClusterKubectl')

  const mode = cluster.provision_type
  let remoteCredentials = null
  if (mode === 'remote') {
    const tokenSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.token_id,
    })

    const caSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.ca_id,
    })

    remoteCredentials = {
      token: tokenSecret.base64data,
      ca: caSecret.base64data,
      apiServer: cluster.desired_state.apiServer,
    }
  }

  return Kubectl({
    mode,
    remoteCredentials,
  })
}

module.exports = ClusterKubectl
