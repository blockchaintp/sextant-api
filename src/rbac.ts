/* eslint-disable camelcase */
/*

  used to tell you if a user can do a certain thing

  actions are objects with the following fields:

    * type - the resource type we are performing an action on
      * user
      * cluster
      * deployment

    * method - the method we are performing
      * list
      * get
      * create
      * update
      * delete

    * resource_id - the resource id we require a role for

  superuser users are automatically allowed access to all methods

  METHOD CONFIG

  each method has a config describing the type of access required

    * if it is an object
      * it contains a config for how to authorize the method
      * a logged in user is automatically required
      * an superuser user is automatically allowed
    * if the method config is a function it looks after it's own case

  here are the meanings of the various config values for each method:

    * superuser
        * if the user is not an superuser - deny
    * minimumUserType
        * the user permission must be at least the given level
    * minimumResourcePermission
        * use the role_resource_type and role_resource_id to check the user
          has at least the given level for the resource
        * required a role_resource_id in the action
    * resourcePermissionForType
        * ensure the role_resource_type being asked for is the given type
        * used when we are performing an action for a resource that needs a certain
          role for another type - for example when creating deployments for a cluster
          we need to check for a write role on the cluster even though the action.type is deployment

  -------- >>>> See /sextant-api/docs/rbac.md for a table documenting expected behavior
          - any changes made to RBAC should be reflected in rbac.md as well.

*/

import { RESOURCE_TYPES, USER_TYPES, PERMISSION_TYPES, PERMISSION_ACCESS_LEVELS } from './config'
import { Store } from './store'
import { ResourceInfo, User } from './store/model/model-types'
import { DatabaseIdentifier } from './store/model/scalar-types'
import * as userUtils from './utils/user'

// Here we rename variables for readability and clarity in the rbac definition.
// Eventually the config variables will be refactored, but until then we will rename them as needed
// const USER_TYPES = USER_TYPES
// const PERMISSION_TYPES = PERMISSION_TYPES
// const PERMISSION_ACCESS_LEVELS = PERMISSION_ACCESS_LEVELS

const HELPERS = {
  // allow a logged in user to read or update it's own record
  // this is so a user can read itself or update their password etc
  allowUserAccessToOwnRecord:
    (opts: { allowAdmin?: boolean; allowSuperuser?: boolean }) => (store: Store, user: User, action: ResourceInfo) => {
      // requires a user
      if (!user) return false

      // superuser gets access if configured
      if (user && userUtils.isSuperuser(user) && opts.allowSuperuser) return true

      // admin gets access if configured
      if (user && userUtils.isAdminuser(user) && opts.allowAdmin) return true

      // if the user is getting it's own data - allow
      // eslint-disable-next-line eqeqeq
      if (action.resource_type == RESOURCE_TYPES.user && action.resource_id == user.id) return true
      return false
    },

  // if there is no user and zero existing users - allow (so the initial account can be created)
  // if there is a user - they must be an admin
  allowInitialAccountCreation: () => async (store: Store, user: User) => {
    if (user) {
      if (userUtils.isSuperuser(user) || userUtils.isAdminuser(user)) return true
      return false
    }

    const users = await store.user.list()
    if (users.length > 0) return false
    return true
  },
}

type ResourceType = 'administration' | 'user' | 'cluster' | 'deployment'
type MethodRule =
  | ((store: Store, user: User) => Promise<boolean>)
  | ((store: Store, user: User, action: ResourceInfo) => boolean)
  | {
      [key in string]: string
    }

type MethodConstraintGroup = {
  [key in string]: MethodRule
}

type MethodGroupConfig = {
  [key in ResourceType]: MethodConstraintGroup
}

const METHOD_CONFIG: MethodGroupConfig = {
  administration: {
    restart: {
      minimumUserType: USER_TYPES.superuser,
    },
    startTime: {
      minimumUserType: USER_TYPES.superuser,
    },
  },

  user: {
    list: {
      minimumUserType: USER_TYPES.admin,
    },
    get: HELPERS.allowUserAccessToOwnRecord({
      allowSuperuser: true,
      allowAdmin: true,
    }),
    create: HELPERS.allowInitialAccountCreation(),
    update: HELPERS.allowUserAccessToOwnRecord({
      allowSuperuser: true,
      allowAdmin: true,
    }),
    token: HELPERS.allowUserAccessToOwnRecord({
      allowSuperuser: false,
    }),
    delete: {
      minimumUserType: USER_TYPES.superuser,
    },
  },

  cluster: {
    // the controller will only list clusters the user has access to
    list: {},
    get: {
      minimumResourcePermission: PERMISSION_TYPES.read,
      minimumUserType: USER_TYPES.user,
    },
    create: {
      minimumUserType: USER_TYPES.admin,
    },
    update: {
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.user,
    },
    updateRole: {
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.admin,
    },
    delete: {
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.admin,
    },
  },

  deployment: {
    // the controller will only list deployments the user has access to
    list: {},
    get: {
      minimumResourcePermission: PERMISSION_TYPES.read,
      minimumUserType: USER_TYPES.user,
    },
    // the resource_id, resource_type for deployment create will be cluster
    create: {
      resourcePermissionForType: RESOURCE_TYPES.cluster,
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.user,
    },
    update: {
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.user,
    },
    updateRole: {
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.admin,
    },
    delete: {
      minimumResourcePermission: PERMISSION_TYPES.write,
      minimumUserType: USER_TYPES.user,
    },
  },
}

export type RBACAction = ResourceInfo & {
  cluster_id?: DatabaseIdentifier
  method: string
  resource_id: DatabaseIdentifier
  resource_type: ResourceType
}

function validateRBACAction(action: RBACAction) {
  const { resource_type, method } = action

  if (!resource_type) throw new Error('resource_type required')
  if (!method) throw new Error('method required')

  const group = METHOD_CONFIG[resource_type]
  if (!group) throw new Error(`unknown resource_type ${resource_type}`)

  const methodConfig = group[method]
  if (!methodConfig) throw new Error(`unknown method ${method}`)
  return { methodConfig }
}

async function checkMinimumPermission(
  methodConfig: { [x: string]: string },
  store: Store,
  user: User,
  action: RBACAction
) {
  const { cluster_id, resource_id, resource_type } = action

  if (methodConfig.minimumResourcePermission) {
    // if the method config is asking for another type of resource type use it
    //  - otherwise default to the action type
    const resourceType = methodConfig.resourcePermissionForType || resource_type

    // if the resourceType is cluster, use the cluster_id for the resourceId
    let resourceId = resource_id
    if (methodConfig.resourcePermissionForType === 'cluster') {
      resourceId = cluster_id
    }

    // we need a resource_id if we are performing a minimumResourcePermission check
    if (!resourceId) return false

    const userId = user.id

    if (!Number.isInteger(userId)) return false

    const roleQuery = {
      user: userId,
      resource_type: resourceType,
      resource_id: resourceId,
    }

    // load the role and check it
    const role = await store.role.get(roleQuery)

    // if there is no role we can't grant access
    if (!role) return false

    // ensure the role has a correct permission value
    if (!PERMISSION_ACCESS_LEVELS[role.permission]) return false

    // check the granted role is at least the required type
    if (PERMISSION_ACCESS_LEVELS[role.permission] < PERMISSION_ACCESS_LEVELS[methodConfig.minimumResourcePermission])
      return false
  }
  return true
}

export const RBAC = async (store: Store, user: User, action: RBACAction) => {
  const { methodConfig } = validateRBACAction(action)
  // if the method handler is a function - it looks after itself
  if (typeof methodConfig === 'function') {
    const result = await methodConfig(store, user, action)
    return result
  }
  // no logged in user - deny
  if (!user) return false

  // if they are an superuser - allow
  if (userUtils.isSuperuser(user)) return true

  // require superuser and they are not - deny
  if (methodConfig.superuser && !userUtils.isSuperuser(user)) return false

  // require at least X user permission - deny
  if (methodConfig.minimumUserType && !userUtils.hasMinimumUserType(user, methodConfig.minimumUserType)) return false

  return checkMinimumPermission(methodConfig, store, user, action)
}
