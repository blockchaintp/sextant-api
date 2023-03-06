/*

  schema

*/
export const API_VERSION = '1.0.0'

// we don't use these in migration files
// because they should be immutable
// these values are used by the rest of the codebase as the 'current' table names
export const TABLES = {
  user: 'useraccount',
  cluster: 'cluster',
  deployment: 'deployment',
  role: 'role',
  task: 'task',
  clusterfile: 'clusterfile',
  clustersecret: 'clustersecret',
  deploymentsecret: 'deploymentsecret',
}

export const LIST_ORDER_BY_FIELDS = {
  cluster: {
    field: 'status',
    direction: 'desc',
  },
  clusterfile: {
    field: 'name',
    direction: 'asc',
  },
  clustersecret: {
    field: 'name',
    direction: 'asc',
  },
  deployment: {
    field: 'name',
    direction: 'asc',
  },
  deploymentsecret: {
    field: 'name',
    direction: 'asc',
  },
  task: {
    field: 'created_at',
    direction: 'desc',
  },
  user: {
    field: 'username',
    direction: 'asc',
  },
}

/*

  resources

*/

export const RESOURCE_TYPES = {
  cluster: 'cluster',
  deployment: 'deployment',
  user: 'user',
}

export const CLUSTER_PROVISION_TYPE = {
  remote: 'remote',
  local: 'local',
}

export const CLUSTER_STATUS = {
  created: 'created',
  provisioned: 'provisioned',
  error: 'error',
  deleted: 'deleted',
}

export const CLUSTER_STATUS_DEFAULT = CLUSTER_STATUS.created

export const DEPLOYMENT_TYPE = {
  sawtooth: 'sawtooth',
  ethereum: 'ethereum',
  daml: 'daml',
  taekion: 'taekion',
}

export const DEPLOYMENT_STATUS = {
  created: 'created',
  provisioned: 'provisioned',
  error: 'error',
  deleted: 'deleted',
}

export const DEPLOYMENT_STATUS_DEFAULT = DEPLOYMENT_STATUS.created

export const TASK_STATUS = {
  created: 'created',
  running: 'running',
  finished: 'finished',
  cancelling: 'cancelling',
  cancelled: 'cancelled',
  error: 'error',
}

export const TASK_STATUS_DEFAULT = TASK_STATUS.created

export const TASK_ACTIVE_STATUSES = [TASK_STATUS.created, TASK_STATUS.running, TASK_STATUS.cancelling]

export const TASK_ACTION = {
  'cluster.create': 'cluster.create',
  'cluster.update': 'cluster.update',
  'cluster.delete': 'cluster.delete',
  'deployment.create': 'deployment.create',
  'deployment.update': 'deployment.update',
  'deployment.delete': 'deployment.delete',
}

// what status we should write to the resources
// if the task completes successfully
export const TASK_RESOURCE_COMPLETE_STATUS = {
  'cluster.create': CLUSTER_STATUS.provisioned,
  'cluster.update': CLUSTER_STATUS.provisioned,
  'cluster.delete': CLUSTER_STATUS.deleted,
  'cluster.error': CLUSTER_STATUS.error,
  'deployment.create': DEPLOYMENT_STATUS.provisioned,
  'deployment.update': DEPLOYMENT_STATUS.provisioned,
  'deployment.delete': DEPLOYMENT_STATUS.deleted,
  'deployment.error': DEPLOYMENT_STATUS.error,
}

// how much time to wait between checking for new tasks
export const TASK_CONTROLLER_LOOP_DELAY = 500

/*

  auth

*/

// Maps to USER_TYPES = USER_TYPES in rbac definition
export const USER_TYPES = {
  superuser: 'superuser', // can do anything
  admin: 'admin', // can create clusters
  user: 'user', // requires role to do things
}

export const USER_ACCESS_LEVELS = {
  [USER_TYPES.superuser]: 3,
  [USER_TYPES.admin]: 2,
  [USER_TYPES.user]: 1,
}

// Maps to PERMISSION = PERMISSION_TYPES in rbac definition
export const PERMISSION_TYPES = {
  read: 'read',
  write: 'write',
}

// Maps to PERMISSION_ACCESS_LEVELS = PERMISSION_ACCESS_LEVELS in rbac definition
export const PERMISSION_ACCESS_LEVELS = {
  [PERMISSION_TYPES.read]: 1,
  [PERMISSION_TYPES.write]: 2,
}

/*

  base config

*/

export const baseUrl = '/api/v1'

export const sessionSecret = 'sextant-blockchain'
export const tokenSecret = 'sextant-blockchain'
