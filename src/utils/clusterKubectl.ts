/*

  given a cluster - return a kubectl client that will connect to it

  it will load the secrets from the store if needed

*/

import { StoreType } from '../store'
import { ClusterEntity } from '../store/entity-types'
import Kubectl from './kubectl'

type ClusterArg = Pick<ClusterEntity, 'id'> & Omit<Partial<ClusterEntity>, 'id'>

const ClusterKubectl = async ({ cluster, store }: { cluster: ClusterArg; store: StoreType }) => {
  if (!cluster) throw new Error('cluster required for ClusterKubectl')
  if (!store) throw new Error('store required for ClusterKubectl')

  const mode = cluster.provision_type
  let remoteCredentials = null
  if (mode === 'remote') {
    const tokenSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.token_id,
    })
    if (!tokenSecret) throw new Error(`token secret not found for cluster ${cluster.id}`)

    const caSecret = await store.clustersecret.get({
      cluster: cluster.id,
      id: cluster.desired_state.ca_id,
    })
    if (!caSecret) throw new Error(`ca secret not found for cluster ${cluster.id}`)

    remoteCredentials = {
      token: tokenSecret.base64data,
      ca: caSecret.base64data,
      apiServer: cluster.desired_state.apiServer,
    }
  } else {
    throw new Error(`unsupported provision type ${mode}`)
  }

  return Kubectl({
    mode,
    remoteCredentials,
  })
}

export default ClusterKubectl
