/* eslint-disable camelcase */
import { DatabaseIdentifier } from './scalar-types'

type StateApplicationInfo = {
  applied_state: { [key: string]: unknown }
  desired_state: { [key: string]: unknown }
}

export type Cluster = StateApplicationInfo & {
  capabilities: unknown
  created_at: Date
  id: DatabaseIdentifier
  maintenance_flag: boolean
  name: string
  provision_type: string
  status: string
}

export type User = {
  created_at: Date
  hashed_password: string
  id: DatabaseIdentifier
  meta: unknown
  permission: string
  server_side_key: string
  username: string
}

export type Role = ResourceInfo & {
  created_at: Date
  id: DatabaseIdentifier
  permission: string
  user: DatabaseIdentifier
}

export type ResourceInfo = {
  resource_id: DatabaseIdentifier
  resource_type: string
}

export type Task = ResourceInfo & {
  action: string
  created_at: Date
  ended_at: Date
  error: string
  id: DatabaseIdentifier
  payload: unknown
  resource_status: unknown
  restartable: boolean
  started_at: Date
  status: string
  user: DatabaseIdentifier
}

export type ClusterFile = {
  base64data: string
  cluster: DatabaseIdentifier
  created_at: Date
  id: DatabaseIdentifier
  name: string
}

export type ClusterSecret = ClusterFile

export type DeploymentSecret = {
  base64data: string
  created_at: Date
  deployment: DatabaseIdentifier
  id: DatabaseIdentifier
  name: string
}

export type Setting = {
  created_at: Date
  id: DatabaseIdentifier
  key: string
  value: string
}

type DeploymentTypeInfo = {
  deployment_type: string
  deployment_version: string
}

export type Deployment = StateApplicationInfo &
  DeploymentTypeInfo & {
    cluster: DatabaseIdentifier
    created_at: Date
    custom_yaml: string
    deployment_method: string
    id: DatabaseIdentifier
    maintenance_flag: boolean
    name: string
    status: string
    updated_at: Date
  }

export type DeploymentHistory = DeploymentTypeInfo & {
  cluster_id: DatabaseIdentifier
  deployment_id: DatabaseIdentifier
  helm_response: unknown
  name: string
  recorded_at: Date
  status: string
}
