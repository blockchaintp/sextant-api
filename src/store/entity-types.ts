import {
  AppliedState,
  ClusterCapabilities,
  ClusterStatus,
  DatabaseIdentifier,
  DeploymentMethod,
  DeploymentStatus,
  DeploymentType,
  DeploymentVersion,
  DesiredState,
  HashedPassword,
  HelmResponse,
  ProvisionType,
  Resource,
  ServerSideKey,
  SettingsKey,
  SettingsValue,
  TaskAction,
  TaskStatus,
  Time,
  UserMeta,
  UserName,
  UserPermission,
} from './domain-types'

export type ClusterEntity = {
  id: DatabaseIdentifier
  created_at: Time
  name: string
  provision_type: ProvisionType
  status: ClusterStatus
  capabilities: ClusterCapabilities
  desired_state: DesiredState
  applied_state: AppliedState
  maintenance_flag: boolean
}

export type ClusterFileEntity = {
  id: DatabaseIdentifier
  created_at: Time
  cluster: DatabaseIdentifier
  name: string
  base64data: string
}

export type ClusterSecretEntity = {
  id: DatabaseIdentifier
  created_at: Time
  cluster: DatabaseIdentifier
  name: string
  base64data: string
}

export type DeploymentEntity = {
  id: DatabaseIdentifier
  created_at: Time
  updated_at: Time
  cluster: DatabaseIdentifier
  name: string
  deployment_type: DeploymentType
  deployment_version: DeploymentVersion
  status: DeploymentStatus
  desired_state: DesiredState
  applied_state: AppliedState
  maintenance_flag: boolean
  custom_yaml: string
  deployment_method: DeploymentMethod
}

export type DeploymentHistoryEntity = {
  recorded_at: Time
  cluster_id: DatabaseIdentifier
  deployment_id: DatabaseIdentifier
  name: string
  status: string
  deployment_type: DeploymentType
  deployment_version: DeploymentVersion
  helm_response: HelmResponse
}

export type DeploymentSecretEntity = {
  id: DatabaseIdentifier
  created_at: Time
  deployment: DatabaseIdentifier
  name: string
  base64data: string
}

export type RoleEntity = {
  id: DatabaseIdentifier
  created_at: Time
  user: DatabaseIdentifier
  permission: UserPermission
} & Resource

export type SettingsEntity = {
  id: DatabaseIdentifier
  created_at: Time
  key: SettingsKey
  value: SettingsValue
}

export type UserEntity = {
  id: DatabaseIdentifier
  created_at: Time
  username: UserName
  hashed_password: HashedPassword
  server_side_key: ServerSideKey
  permission: UserPermission
  meta: UserMeta
}

export type TaskEntity = {
  id: DatabaseIdentifier
  created_at: Time
  started_at: Time
  ended_at: Time
  user: DatabaseIdentifier
  status: TaskStatus
  action: TaskAction
  restartable: boolean
  resource_status: any
  payload: any
  error: string
} & Resource
