export type DatabaseIdentifier = number

export type SettingsKey = string
export type SettingsValue = string
export type DesiredState = any
export type AppliedState = any
export type ProvisionType = 'local' | 'remote'
export type DeploymentType = string
export type DeploymentVersion = string
export type UserName = string
export type HashedPassword = string
export type ServerSideKey = string
export type UserPermission = string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UserMeta = any

export type HelmResponse = any
export type Time = any
export type ResourceType = string

export type DeploymentStatus = string
export type ClusterStatus = string
export type TaskStatus = string

export type TaskAction = string

export type ClusterCapabilities = {
  [key: string]: boolean
}

export type RawData = WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>
export type SecretData = {
  rawData?: RawData
  base64data?: string
}

export type Resource = {
  resource_id: DatabaseIdentifier
  resource_type: ResourceType
}

export type DeploymentMethod = string
