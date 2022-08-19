import {
  ClusterCapabilities,
  DatabaseIdentifier,
  DeploymentStatus,
  DeploymentType,
  DeploymentVersion,
  DesiredState,
  HelmResponse,
  ProvisionType,
  RawData,
  Resource,
  SecretData,
  SettingsKey,
  TaskStatus,
  Time,
  UserName,
  UserPermission,
} from './domain-types'
import {
  ClusterFileEntity,
  ClusterSecretEntity,
  DeploymentEntity,
  SettingsEntity,
  TaskEntity,
  UserEntity,
} from './entity-types'

export type IDBasedRequest = {
  id: DatabaseIdentifier
}

export type ClusterStoreOptions = {
  deleted?: boolean
}
export type ClusterListRequest = ClusterStoreOptions

export type ClusterCreateRequest = {
  data: {
    name: string
    provision_type: ProvisionType
    capabilities: ClusterCapabilities
    desired_state: DesiredState
  }
}

export type ClusterUpdateRequest = {
  id: DatabaseIdentifier
  data: any
}

export type DeploymentHistoryCreateRequest = {
  data: {
    cluster_id: DatabaseIdentifier
    deployment_id: DatabaseIdentifier
    name: string
    deployment_type: DeploymentType
    deployment_version: DeploymentVersion
    status: DeploymentStatus
    helm_response: HelmResponse
  }
}

export type TimeRange = {
  after: Time
  before: Time
}

export type DeploymentHistoryGetRequest = {
  deployment_id: DatabaseIdentifier
  limit?: number
} & TimeRange

export type DeploymentHistoryListRequest = TimeRange

export type DeploymentSecretListRequest = {
  deployment: DatabaseIdentifier
}

export type DeploymentSecretGetRequest = {
  deployment: DatabaseIdentifier
  id: DatabaseIdentifier
  name: string
}

export type DeploymentSecretCreateRequest = {
  data: {
    deployment: DatabaseIdentifier
    name: string
  } & SecretData
}

export type DeploymentSecretUpdateRequest = {
  deployment: DatabaseIdentifier
  id: DatabaseIdentifier
  name: string
  data: SecretData
}

export type DeploymentSecretDeleteRequest = {
  deployment: DatabaseIdentifier
  id?: DatabaseIdentifier
  name?: string
}

export type DeploymentSecretReplaceRequest = {
  data: {
    deployment: DatabaseIdentifier
    name: string
  } & SecretData
}

export type DeploymentSecretDeleteForDeploymentRequest = {
  deployment: DatabaseIdentifier
}

export type UserDeleteRequest = IDBasedRequest

export type UserGetRequest = {
  id?: DatabaseIdentifier
  username?: UserName
}

export type _UserData = Omit<UserEntity, 'id' | 'created_at'>

export type UserCreateRequest = {
  data: _UserData
}

export type UserUpdateRequest = {
  id: DatabaseIdentifier
  data: Partial<_UserData>
}

export type RoleListForUserRequest = {
  user: DatabaseIdentifier
}

export type RoleListForResourceRequest = Resource

export type RoleGetRequest = {
  user: DatabaseIdentifier
} & Resource

export type RoleCreateRequest = {
  data: {
    user: DatabaseIdentifier
    permission: UserPermission
  } & Resource
}

export type RoleDeleteRequest = IDBasedRequest

export type RoleDeleteForResourceRequest = Resource

export type SettingsCreateRequest = {
  data: Omit<SettingsEntity, 'id' | 'created_at'>
}

export type SettingsUpdateRequest = {
  key: SettingsKey
  data: Pick<SettingsEntity, 'value'>
}

export type SettingsDeleteRequest = {
  id?: DatabaseIdentifier
  key?: SettingsKey
}

export type SettingsGetRequest = SettingsDeleteRequest

export type ResourceStatusTerminalStateSpec = {
  completed: string
  error: string
}

export type TaskCreateRequest = {
  data: Omit<TaskEntity, 'id' | 'created_at' | 'started_at' | 'ended_at'> & {
    resource_status: ResourceStatusTerminalStateSpec
  }
}

export type TaskUpdateRequest = IDBasedRequest & {
  data: {
    status: TaskStatus
    error?: any
    started_at?: Time
    ended_at?: Time
  }
}

export type TaskDeleteForResourceRequest = Resource

export type TaskListRequest = {
  cluster?: DatabaseIdentifier
  deployment?: DatabaseIdentifier
  user?: DatabaseIdentifier
  status?: TaskStatus | TaskStatus[] | string[]
  limit?: number
}

export type TaskListActiveForResourceRequest = {
  cluster?: DatabaseIdentifier
  deployment?: DatabaseIdentifier
}

export type TaskListRecentForResourceRequest = TaskListActiveForResourceRequest

export type TaskGetRequest = IDBasedRequest

export type ClusterFileListRequest = {
  cluster: DatabaseIdentifier
}

export type ClusterFileGetRequest = {
  cluster: DatabaseIdentifier
  id?: DatabaseIdentifier
  name?: string
}

export type ClusterFileCreateRequest = {
  data: Omit<ClusterFileEntity, 'id' | 'crrated_at' | 'base64data'> & {
    base64data?: string
    rawData?: RawData
  }
}

export type ClusterFileUpdateRequest = ClusterFileGetRequest & {
  data: {
    base64data?: string
    rawData?: RawData
  }
}

export type ClusterFileDeleteRequest = ClusterFileGetRequest
export type ClusterFileDeleteForClusterRequest = {
  cluster: DatabaseIdentifier
}

export type ClusterSecretListRequest = {
  cluster: DatabaseIdentifier
}

export type ClusterSecretGetRequest = {
  cluster: DatabaseIdentifier
  id?: DatabaseIdentifier
  name?: string
}

export type ClusterSecretCreateRequest = {
  data: Omit<ClusterSecretEntity, 'id' | 'created_at' | 'base64data'> & {
    base64data?: string
    rawData?: RawData
  }
}

export type ClusterSecretUpdateRequest = ClusterSecretGetRequest & {
  data: {
    base64data?: string
    rawData?: RawData
  }
}

export type ClusterSecretDeleteRequest = ClusterSecretGetRequest

export type ClusterSecretReplaceRequest = ClusterSecretCreateRequest

export type ClusterSecretDeleteForClusterRequest = {
  cluster: DatabaseIdentifier
}

export type DeploymentListRequest = {
  cluster: DatabaseIdentifier | 'all'
  deleted?: boolean
}

export type DeploymentGetRequest = IDBasedRequest

export type DeploymentCreateRequest = {
  data: Pick<
    DeploymentEntity,
    | 'cluster'
    | 'name'
    | 'deployment_type'
    | 'deployment_version'
    | 'desired_state'
    | 'custom_yaml'
    | 'deployment_method'
  >
}

export type DeploymentUpdateRequest = DeploymentGetRequest & {
  data: Partial<DeploymentEntity>
}

export type DeploymentDeleteRequest = IDBasedRequest

export type DeploymentUpdateStatusRequest = {
  id: DatabaseIdentifier
  helm_response: HelmResponse
  data: Partial<DeploymentEntity>
}
