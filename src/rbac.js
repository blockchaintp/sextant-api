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
      
  admin users are automatically allowed access to all methods

  METHOD CONFIG

  each method has a config describing the type of access required

    * if it is an object
      * it contains a config for how to authorize the method
      * a logged in user is automatically required
      * an admin user is automatically allowed
    * if the method config is a function it looks after it's own case
      
  here are the meanings of the various config values for each method:

    * admin
        * if the user is not an admin - deny
    * userRole
        * the user role must be at least the given level
    * resourceRole
        * use the role_resource_type and role_resource_id to check the user 
          has at least the given level for the resource
        * required a role_resource_id in the action 
    * resourceRoleForType
        * ensure the role_resource_type being asked for is the given type
        * used when we are performing an action for a resource that needs a certain
          role for another type - for example when creating deployments for a cluster
          we need to check for a write role on the cluster even though the action.type is deployment

*/

const ACCESS_LEVELS = {
  read: 1,
  write: 2,
  admin: 3,
}

const HELPERS = {

  // allow a logged in user to read or update it's own record
  // this is so a user can read itself or update their password etc
  allowUserAccessToOwnRecord: (store, user, action, done) => {
    // requires a user
    if(!user) return done(`access denied`)
    // admin gets access
    if(user && user.role == 'admin') return done()
  
    // if the user is getting it's own data - allow
    if(action.resource_type == 'user' && action.resource_id == user.id) return done()
    else return done(`access denied`)
  },

  // if there is no user and zero existing users - allow (so the initial account can be created)
    // if there is a user - they must be an admin
  allowInitialAccountCreation: (store, user, action, done) => {
    if(user) {
      if(user.role == 'admin') return done()
      else return done(`access denied`)
    }
    else {
      store.user.list((err, users) => {
        if(err) return done(err)
        if(users.length > 0) return done(`access denied`)
        return done()
      })
    }
  }
}

const METHOD_CONFIG = {
  user: {
    list: {
      admin: true,
    },
    get: HELPERS.allowUserAccessToOwnRecord,
    create: HELPERS.allowInitialAccountCreation,
    update: HELPERS.allowUserAccessToOwnRecord,
    delete: {
      admin: true,
    },
  },

  cluster: {
    // the controller will only list clusters the user has access to
    list: {},
    get: {
      resourceRole: 'read',
    },
    create: {
      userRole: 'write',
    },
    update: {
      resourceRole: 'write',
    },
    delete: {
      resourceRole: 'write',
    }
  },

  deployment: {
    // ask for read access to the given cluster
    list: {
      resourceRole: 'read',
      resourceRoleForType: 'cluster',
    },
    get: {
      resourceRole: 'read',
    },
    // the resource_id, resource_type for deployment create will be cluster
    create: {
      resourceRole: 'write',
      resourceRoleForType: 'cluster',
    },
    update: {
      resourceRole: 'write',
    },
    delete: {
      resourceRole: 'write',
    }
  }
}

const RBAC = (store, user, action, done) => {

  const {
    resource_type,
    resource_id,
    method,
  } = action

  if(!resource_type) return done(`resource_type required`)
  if(!method) return done(`method required`)

  const group = METHOD_CONFIG[resource_type]
  if(!group) return done(`unknown resource_type ${resource_type}`)

  const methodConfig = group[method]
  if(!methodConfig) return done(`unknown method ${method}`)

  // if the method handler is a function - it looks after itself
  if(typeof(methodConfig) === 'function') {
    methodConfig(store, user, action, done)
  }
  else {

    // no logged in user - deny
    if(!user) return done(`access denied`)

    // if they are an admin - allow
    if(user.role == 'admin') return done()

    // require admin and they are not - deny
    if(methodConfig.admin && user.role != 'admin') return done(`access denied`)

    // require at least X user role - deny
    if(methodConfig.userRole && ACCESS_LEVELS[user.role] < ACCESS_LEVELS[methodConfig.userRole]) return done(`access denied`)

    // require the action resource type be 
    if(methodConfig.resourceRole) {
      // we need a resource_id if we are performing a resourceRole check
      if(!resource_id) return done(`access denied`)

      // if the method config is asking for another type of resource type use it - otherwise default to the action type
      const resourceType = methodConfig.resourceRoleForType || resource_type

      // load the role and check it
      store.role.get({
        user: user.id,
        resource_type: resourceType,
        resource_id,
      }, (err, role) => {
        if(err) return done(err)

        // if there is no role we can't grant access
        if(!role) return done(`access denied`)

        // ensure the role has a correct permission value
        if(!ACCESS_LEVELS[role.permission]) return done(`access denied`)

        // check the granted role is at least the required type
        if(ACCESS_LEVELS[role.permission] < ACCESS_LEVELS[methodConfig.resourceRole]) return done(`access denied`)

        // ok - we are allowed
        return done()
      })
    }
    else {
      // we assume that there are no checks to perform for this method so allow
      done()
    }
  }
}

module.exports = RBAC
