import { Cluster } from '../model/model-types'
import { DatabaseIdentifier } from '../model/scalar-types'

export type ClusterCreateRequest = {
  data: Pick<Cluster, 'name' | 'provision_type' | 'desired_state'> &
    Partial<Omit<Cluster, 'name' | 'provision_type' | 'desired_state'>>
}

export type ClusterDeleteRequest = { id: DatabaseIdentifier }

export type ClusterDeletePermanentlyRequest = { id: DatabaseIdentifier }

export type ClusterGetRequest = { id: DatabaseIdentifier }

export type ClusterListRequest = { deleted?: boolean }

export type ClusterUpdateRequest = { data: Partial<Cluster>; id: DatabaseIdentifier }
