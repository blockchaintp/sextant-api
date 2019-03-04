/*

  used to tell you if a user can do a certain thing
  
  actions are objects with the following fields:

    {
      resource_type,
      resource_id,
      parent_id,
      method,
    }

    resource_type:
  
     * user
     * cluster
     * deployment
    
    methods:

     * list
     * get
     * create
     * update
     * delete
  
  anything in the user namespace needs an admin user

  the exceptions are
  
    'user.create' - if there are currently no users
    then we allow a user.create from a non-logged in user (as this is the genesis admin user)

    'user.{get,update}' - if the resource_id is the id of the currently logged in user then we allow it

  all other actions are allowed by admins
  list actions are allowed by all users - they will only see things they have a read/write role bound to

  create actions - are special:

   'cluster.create' requires the user.role to be write or admin
   'deployment.create' requires a writable role on the cluster the deployment is for (denoted by parentId)

  get actions need a read role bound to the item in question
  {create,update,delete} actions need a write role bound to the item in question

  the handler will return an error if access is not allowed

*/

const ACCESS_LEVELS = {
  read: 1,
  write: 2,
  admin: 3,
}

// handler to deny access
const deny = (store, user, action, done) => done(`access denied`)

// if there is a user and they are admin - allow
const allowAdmin = (handler) => (store, user, action, done) => {
  if(user && user.role == 'admin') return done()
  handler(store, user, action, done)
}

// helper to allow if the user is the same as the item being affected
// i.e. action.resource_type == 'user' && action.resource_id == user.id
// admin overrides this
const allowSameUser = (handler) => (store, user, action, done) => {
  if(user && user.id == action.resource_id) return done(`access denied`)
  handler(store, user, action, done)
}


// insist there is a logged in user
const requireUser = (handler) => (store, user, action, done) => {
  if(!user) return done(`access denied`)
  handler(store, user, action, done)
}

const roleHandler = (store, accessLevel, query, done) => {
  store.role.get(query, (err, role) => {
    if(err) return done(err)
    if(!role) return done(`access denied`)
    if(!ACCESS_LEVELS[role.permission] || ACCESS_LEVELS[role.permission] < accessLevel) return done(`access denied`)
    return done()
  })
}

const resourceHandler = (accessLevel) => allowAdmin(requireUser((store, user, action, done) => {
  resourceHandler(store, ACCESS_LEVELS.read, {
    user: user.id,
    resource_type: action.resource_type,
    resource_id: action.resource_id,
  }, done)
}))

const readHandler = allowAdmin(requireUser((store, user, action, done) => {
  resourceHandler(store, ACCESS_LEVELS.read, {
    user: user.id,
    resource_type: action.resource_type,
    resource_id: action.resource_id,
  }, done)
}))

const writeHandler = allowAdmin(requireUser((store, user, action, done) => {
  resourceHandler(store, ACCESS_LEVELS.write, {
    user: user.id,
    resource_type: action.resource_type,
    resource_id: action.resource_id,
  }, done)
}))

// allow for special case handlers
const TYPE_HANDLERS = {
  user: {

    // only admin can see or delete users
    list: allowAdmin(deny),
    delete: allowAdmin(deny),

    /*
    
      these methods are used for the 'edit your account' section
      i.e. the user changes their own settings
    
    */
    get: allowAdmin(allowSameUser(deny)),
    update: allowAdmin(allowSameUser(deny)),

    /*
  
    to allow the initial user to be created

    these are the only two cases that allow a user.create

     * the user is logged in and has role=admin
     * the user is not logged in and there are zero existing users
  
  */
    create: allowAdmin((store, user, action, done) => {
      if(!user) {
        // if there is no user and there are zero existing users - allow
        store.user.list((err, users) => {
          if(err) return done(err)
          if(users.length > 0) return done(`requires a user with admin access`)
          return done()
        })
      }
      else {
        return done(`access denied`)
      }
      
    }),
  },
  cluster: {

    // the user must be either admin or have at at least a write role
    create: allowAdmin((store, user, action, done) => {
      if(!user) return done(`access denied`)
      if(user && ACCESS_LEVELS[user.role] >= ACCESS_LEVELS.write) return done()
      else return done(`access denied`)
    }),

  },
  deployment: {

    // the user must be either admin or have a write role on the cluster
    // the deployment is for
    create: allowAdmin((store, user, action, done) => {
      if(!user) return done(`access denied`)
      // we must be given a parentId to determine if the user has write access to the cluster
      if(!action.parentId) return done(`access denied`)

      roleHandler(store, ACCESS_LEVELS.write, {
        user: user.id,
        resource_type: 'cluster',
        resource_id: action.parentId,
      }, done)
    }),
  },
}

// generic CRUD method handlers
const METHOD_HANDLERS = {

  // allow any logged in user - the list controller will use this to determine what to display
  list: requireUser,

  // if not admin - a read role binding for the resource_id must exist
  get: resourceHandler(ACCESS_LEVELS.read),

  // create is handled by the specific type handlers above

  // if not admin - a read role binding for the resource_id must exist
  update: resourceHandler(ACCESS_LEVELS.write),

  // if not admin - a read role binding for the resource_id must exist
  delete: resourceHandler(ACCESS_LEVELS.write),
}

const RBAC = (store, user, action, done) => {
  if(!TYPE_HANDLERS[action.resource_type]) return done(`unknown resource_type ${action.resource_type}`)
  if(!METHOD_HANDLERS[action.method]) return done(`unknown method ${action.method}`)

  const typeHandler = TYPE_HANDLERS[action.resource_type][action.method]
  const methodHandler = METHOD_HANDLERS[action.method]

  // look for a special case handler
  if(typeHandler) {
    typeHandler(store, user, action, done)
  }
  else {
    // run the generic method handler
    methodHandler(store, user, action, done)
  }
}

module.exports = RBAC
