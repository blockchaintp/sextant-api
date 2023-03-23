import { User } from '../../store/model/model-types'
import { DatabaseIdentifier } from '../../store/model/scalar-types'

export type ClusterListRequest = { deleted?: boolean; user: User; withTasks?: boolean }

export type ClusterGetRequest = { id: DatabaseIdentifier; withTask?: boolean }

export type ClusterCreateRequestV1 = {
  data: {
    capabilities: string[]
    desired_state: {
      apiServer: string
      ca: string
      token: string
    }
    name: string
    provision_type: string
  }
  user: User
}

export type ClusterUpdateRequest = { data: object; id: DatabaseIdentifier; user: User }

export type ClusterDeleteRequest = { id: DatabaseIdentifier; user: User }

export type ClusterDeletePermanentlyRequest = { id: DatabaseIdentifier; user: User }

export type ClusterGetRolesRequest = { id: DatabaseIdentifier; user: User }

export type ClusterCreateRoleRequest = {
  id: DatabaseIdentifier
  permission: string
  user: DatabaseIdentifier
  username: string
}

export type ClusterDeleteRoleRequest = { id: DatabaseIdentifier; user: DatabaseIdentifier }

export type ClusterGetTasksRequest = { id: DatabaseIdentifier; user: User }

export type ClusterResourcesRequest = { id: DatabaseIdentifier; user: User }

export type ClusterSummaryRequest = { id: DatabaseIdentifier; user: User }
