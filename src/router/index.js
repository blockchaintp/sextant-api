const rbac = require('../rbac')

const ConfigRoutes = require('./config')
const UserRoutes = require('./user')
const ClusterRoutes = require('./cluster')

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
  if(!req.user) {
    res._code = 403
    return next(`not logged in`)
  }
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
  const cluster = ClusterRoutes(controllers)

  app.get(basePath('/config/values'), config.values)

  app.get(basePath('/user/status'), user.status)
  app.get(basePath('/user/hasInitialUser'), user.hasInitialUser)
  app.post(basePath('/user/login'), user.login)
  app.get(basePath('/user/logout'), requireUser, user.logout)

  app.get(basePath('/user'), rbacMiddleware(store, 'user', 'list'), user.list)
  app.post(basePath('/user'), rbacMiddleware(store, 'user', 'create'), user.create)
  app.get(basePath('/user/:id'), rbacMiddleware(store, 'user', 'get'), user.get)
  app.put(basePath('/user/:id'), rbacMiddleware(store, 'user', 'update'), user.update)
  app.get(basePath('/user/:id/token'), rbacMiddleware(store, 'user', 'token'), user.getToken)
  app.put(basePath('/user/:id/token'), rbacMiddleware(store, 'user', 'token'), user.updateToken)
  app.delete(basePath('/user/:id'), rbacMiddleware(store, 'user', 'delete'), user.delete)

  app.get(basePath('/clusters'), rbacMiddleware(store, 'cluster', 'list'), cluster.list)
  app.get(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'get'), cluster.get)
  app.post(basePath('/clusters'), rbacMiddleware(store, 'cluster', 'create'), cluster.create)
  app.put(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'update'), cluster.update)
  app.delete(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'delete'), cluster.delete)
  app.get(basePath('/clusters/:id/roles'), rbacMiddleware(store, 'cluster', 'get'), cluster.listRoles)
  app.post(basePath('/clusters/:id/roles'), rbacMiddleware(store, 'cluster', 'update'), cluster.createRole)
  app.delete(basePath('/clusters/:id/roles/:userid'), rbacMiddleware(store, 'cluster', 'update'), cluster.deleteRole)
  app.get(basePath('/clusters/:id/tasks'), rbacMiddleware(store, 'cluster', 'get'), cluster.listTasks)
}

module.exports = Routes
