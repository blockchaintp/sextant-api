/*

  schema

*/


// we don't use these in migration files
// because they should be immutable
// these values are used by the rest of the codebase as the 'current' table names
const TABLES = {
  user: 'useraccount',
  cluster: 'cluster',
  deployment: 'deployment',
  role: 'role',
  task: 'task',
  clusterfile: 'clusterfile',
  clustersecret: 'clustersecret',
}

const LIST_ORDER_BY_FIELDS = {
  cluster: {
    field: 'name',
    direction: 'asc',
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
  task: {
    field: 'created_at',
    direction: 'desc',
  },
  user: {
    field: 'username',
    direction: 'asc',
  }
}

/*

  resources

*/

const RESOURCE_TYPES = {
  cluster: 'cluster',
  deployment: 'deployment',
  user: 'user',
}

const CLUSTER_PROVISION_TYPE = {
  remote: 'remote',
  local: 'local',
}

const CLUSTER_STATUS = {
  created: 'created',
  provisioned: 'provisioned',
  error: 'error',
  deleted: 'deleted',
}

const CLUSTER_STATUS_DEFAULT = CLUSTER_STATUS.created

const DEPLOYMENT_TYPE = {
  sawtooth: 'sawtooth',
  ethereum: 'ethereum',
}

const DEPLOYMENT_STATUS = {
  created: 'created',
  provisioned: 'provisioned',
  error: 'error',
  deleted: 'deleted',
}

const DEPLOYMENT_STATUS_DEFAULT = DEPLOYMENT_STATUS.created

const TASK_STATUS = {
  created: 'created',
  running: 'running',
  finished: 'finished',
  cancelling: 'cancelling',
  cancelled: 'cancelled',
  error: 'error',
}

const TASK_STATUS_DEFAULT = TASK_STATUS.created

const TASK_ACTIVE_STATUSES = [
  TASK_STATUS.created,
  TASK_STATUS.running,
  TASK_STATUS.cancelling,
]

const TASK_ACTION = {
  'cluster.create': 'cluster.create',
  'cluster.update': 'cluster.update',
  'cluster.delete': 'cluster.delete',
  'deployment.create': 'deployment.create',
  'deployment.update': 'deployment.update',
  'deployment.delete': 'deployment.delete',
}

// what status we should write to the resources
// if the task completes successfully
const TASK_RESOURCE_COMPLETE_STATUS = {
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
const TASK_CONTROLLER_LOOP_DELAY = 500

/*

  auth

*/

const ACCESS_LEVELS = {
  read: 1,
  write: 2,
  all: 3,
}

const PERMISSION_USER = {
  superuser: 'superuser',  // can do anything
  admin: 'admin',          // can create clusters
  user: 'user',            // requires role to do things
}

const PERMISSION_USER_ACCESS_LEVELS = {
  [PERMISSION_USER.superuser]: ACCESS_LEVELS.all,
  [PERMISSION_USER.admin]: ACCESS_LEVELS.write,
  [PERMISSION_USER.user]: ACCESS_LEVELS.read,
}

const PERMISSION_ROLE = {
  read: 'read',
  write: 'write',
}

const PERMISSION_ROLE_ACCESS_LEVELS = {
  [PERMISSION_ROLE.read]: ACCESS_LEVELS.read,
  [PERMISSION_ROLE.write]: ACCESS_LEVELS.write,
}

/*

  base config

*/
const config = {
  baseUrl: '/api/v1',
  sessionSecret: 'sextant-blockchain',
  tokenSecret: 'sextant-blockchain',
  TABLES,
  LIST_ORDER_BY_FIELDS,
  RESOURCE_TYPES,
  CLUSTER_PROVISION_TYPE,
  CLUSTER_STATUS,
  CLUSTER_STATUS_DEFAULT,
  DEPLOYMENT_TYPE,
  DEPLOYMENT_STATUS,
  DEPLOYMENT_STATUS_DEFAULT,
  TASK_STATUS,
  TASK_ACTION,
  TASK_ACTIVE_STATUSES,
  TASK_STATUS_DEFAULT,
  TASK_RESOURCE_COMPLETE_STATUS,
  TASK_CONTROLLER_LOOP_DELAY,
  ACCESS_LEVELS,
  PERMISSION_USER,
  PERMISSION_USER_ACCESS_LEVELS,
  PERMISSION_ROLE,
  PERMISSION_ROLE_ACCESS_LEVELS,
}

module.exports = config