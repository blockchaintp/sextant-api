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
    * userPermission
        * the user permission must be at least the given level
    * resourcePermission
        * use the role_resource_type and role_resource_id to check the user 
          has at least the given level for the resource
        * required a role_resource_id in the action 
    * resourcePermissionForType
        * ensure the role_resource_type being asked for is the given type
        * used when we are performing an action for a resource that needs a certain
          role for another type - for example when creating deployments for a cluster
          we need to check for a write role on the cluster even though the action.type is deployment

*/

const config = require('./config')
const userUtils = require('./utils/user')

const {
  RESOURCE_TYPES,
  PERMISSION_USER,
  PERMISSION_ROLE,
  PERMISSION_ROLE_ACCESS_LEVELS,
} = config

const HELPERS = {

  // allow a logged in user to read or update it's own record
  // this is so a user can read itself or update their password etc
  allowUserAccessToOwnRecord: (opts) => async (store, user, action) => {
    // requires a user
    if(!user) return false

    // superuser gets access if configured
    if(user && userUtils.isSuperuser(user) && opts.allowSuperuser) return true
  
    // if the user is getting it's own data - allow
    if(action.resource_type == RESOURCE_TYPES.user && action.resource_id == user.id) return true
    else return false
  },

  // if there is no user and zero existing users - allow (so the initial account can be created)
    // if there is a user - they must be an admin
  allowInitialAccountCreation: (opts) => async (store, user, action) => {
    if(user) {
      if(userUtils.isSuperuser(user)) return true
      else return false
    }
    else {
      const users = await store.user.list({})
      if(users.length > 0) return false
      return true
    }
  }
}

const METHOD_CONFIG = {
  user: {
    list: {
      superuser: true,
    },
    get: HELPERS.allowUserAccessToOwnRecord({
      allowSuperuser: true,
    }),
    create: HELPERS.allowInitialAccountCreation(),
    update: HELPERS.allowUserAccessToOwnRecord({
      allowSuperuser: true,
    }),
    token: HELPERS.allowUserAccessToOwnRecord({
      allowSuperuser: false,
    }),
    delete: {
      superuser: true,
    },
  },

  cluster: {
    // the controller will only list clusters the user has access to
    list: {},
    get: {
      resourcePermission: PERMISSION_ROLE.read,
    },
    create: {
      userPermission: PERMISSION_USER.admin,
    },
    update: {
      resourcePermission: PERMISSION_ROLE.write,
    },
    delete: {
      resourcePermission: PERMISSION_ROLE.write,
    }
  },

  deployment: {
    // the controller will only list deployments the user has access to
    list: {},
    get: {
      resourcePermission: PERMISSION_ROLE.read,
    },
    // the resource_id, resource_type for deployment create will be cluster
    create: {
      resourcePermission: PERMISSION_ROLE.write,
      resourcePermissionForType: RESOURCE_TYPES.cluster,
    },
    update: {
      resourcePermission: PERMISSION_ROLE.write,
    },
    delete: {
      resourcePermission: PERMISSION_ROLE.write,
    }
  }
}

const RBAC = async (store, user, action) => {

  const {
    resource_type,
    resource_id,
    method,
  } = action

  if(!resource_type) throw new Error(`resource_type required`)
  if(!method) throw new Error(`method required`)

  const group = METHOD_CONFIG[resource_type]
  if(!group) throw new Error(`unknown resource_type ${resource_type}`)

  const methodConfig = group[method]
  if(!methodConfig) throw new Error(`unknown method ${method}`)

  // if the method handler is a function - it looks after itself
  if(typeof(methodConfig) === 'function') {
    const result = await methodConfig(store, user, action)
    return result
  }
  else {

    // no logged in user - deny
    if(!user) return false

    // if they are an superuser - allow
    if(userUtils.isSuperuser(user)) return true

    // require superuser and they are not - deny
    if(methodConfig.superuser && !userUtils.isSuperuser(user)) return false

    // require at least X user permission - deny
    if(methodConfig.userPermission && !userUtils.hasPermission(user, methodConfig.userPermission)) return false
      
    // require a resource role with the given permission
    if(methodConfig.resourcePermission) {

      // we need a resource_id if we are performing a resourcePermission check
      if(!resource_id) return false

      // if the method config is asking for another type of resource type use it - otherwise default to the action type
      const resourceType = methodConfig.resourcePermissionForType || resource_type

      const roleQuery = {
        user: user.id,
        resource_type: resourceType,
        resource_id,
      }

      // load the role and check it
      const role = await store.role.get(roleQuery)
      
      // if there is no role we can't grant access
      if(!role) return false

      // ensure the role has a correct permission value
      if(!PERMISSION_ROLE_ACCESS_LEVELS[role.permission]) return false

      // check the granted role is at least the required type
      if(PERMISSION_ROLE_ACCESS_LEVELS[role.permission] < PERMISSION_ROLE_ACCESS_LEVELS[methodConfig.resourcePermission]) return false

      // ok - we are allowed
      return true
    }
    else {
      // we assume that there are no checks to perform for this method so allow
      return true
    }
  }
}

module.exports = RBAC
