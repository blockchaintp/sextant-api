/*
  given a cluster - return a kubectl client that will connect to it
  it will load the secrets from the store if needed
*/
import { Store } from '../store'
import { Cluster } from '../store/model/model-types'
import { Kubectl, RemoteCredentials } from './kubectl'

export async function ClusterKubectl({ cluster, store }: { cluster: Cluster; store: Store }) {
  if (!cluster) throw new Error('cluster required for ClusterKubectl')
  if (!store) throw new Error('store required for ClusterKubectl')

  const mode = cluster.provision_type
  let remoteCredentials: RemoteCredentials = null
  if (mode === 'remote') {
    const tokenSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.token_id as number,
    })

    const caSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.ca_id as number,
    })

    remoteCredentials = {
      token: tokenSecret.base64data,
      ca: caSecret.base64data,
      apiServer: cluster.desired_state.apiServer as string,
    }
  }

  return new Kubectl({
    mode,
    remoteCredentials,
  })
}

module.exports = ClusterKubectl
