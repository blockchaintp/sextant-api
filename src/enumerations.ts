import {
  RESOURCE_TYPES as _RESOURCE_TYPES,
  CLUSTER_PROVISION_TYPE as _CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS as _CLUSTER_STATUS,
  DEPLOYMENT_TYPE as _DEPLOYMENT_TYPE,
  DEPLOYMENT_STATUS as _DEPLOYMENT_STATUS,
  TASK_STATUS as _TASK_STATUS,
  TASK_ACTION as _TASK_ACTION,
  USER_TYPES as _USER_TYPES,
  PERMISSION_TYPES as _PERMISSION_TYPES,
} from './config'

// turn an object of keys into an array of the values
const getEnumeration = (configMap: { [key: string]: string }): string[] => Object.values(configMap)

export const RESOURCE_TYPES = getEnumeration(_RESOURCE_TYPES)
export const CLUSTER_PROVISION_TYPE = getEnumeration(_CLUSTER_PROVISION_TYPE)
export const CLUSTER_STATUS = getEnumeration(_CLUSTER_STATUS)
export const DEPLOYMENT_TYPE = getEnumeration(_DEPLOYMENT_TYPE)
export const DEPLOYMENT_STATUS = getEnumeration(_DEPLOYMENT_STATUS)
export const TASK_STATUS = getEnumeration(_TASK_STATUS)
export const TASK_ACTION = getEnumeration(_TASK_ACTION)
export const USER_TYPES = getEnumeration(_USER_TYPES)
export const PERMISSION_TYPES = getEnumeration(_PERMISSION_TYPES)
