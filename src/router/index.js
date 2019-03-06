const userUtils = require('../utils/user')
const rbac = require('../rbac')

const ConfigRoutes = require('./config')
const UserRoutes = require('./user')

const rbacMiddleware = (store, resource_type, method) => (req, res, next) => {
  rbac(store, req.user, {
    resource_type,
    resource_id: req.params.id,
    method,
  }, (err) => {
    if(err) {
      res.status(403)
      res.json({
        error: err.toString(),
      })
    }
    else {
      return next()
    }
  })
}

const requireUser = (req, res, next) => {
  if(!req.user) return next(`not logged in`)
  next()
}

const Routes = ({
  app,
  controllers,
  settings,
  store,
}) => {

  const basePath = (path) => `${settings.baseUrl}${path}`

  const config = ConfigRoutes(controllers)
  const user = UserRoutes(controllers)
  
  app.get(basePath('/config/version'), config.version)
  app.get(basePath('/config/values'), config.values)

  app.get(basePath('/user/status'), user.status)
  app.get(basePath('/user/hasInitialUser'), user.hasInitialUser)
  app.post(basePath('/user/login'), user.login)
  app.get(basePath('/user/logout'), requireUser, user.logout)

  app.get(basePath('/user'), rbacMiddleware(store, 'user', 'list'), user.list)
  app.post(basePath('/user'), rbacMiddleware(store, 'user', 'create'), user.create)
  app.get(basePath('/user/:id'), rbacMiddleware(store, 'user', 'get'), user.get)
  app.put(basePath('/user/:id'), rbacMiddleware(store, 'user', 'update'), user.update)
  app.delete(basePath('/user/:id'), rbacMiddleware(store, 'user', 'delete'), user.del)
}

module.exports = Routes
