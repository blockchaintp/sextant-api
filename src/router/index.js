const asyncHandler = require('express-async-handler')
const rbac = require('../rbac')

const ConfigRoutes = require('./config')
const UserRoutes = require('./user')
const ClusterRoutes = require('./cluster')
const DeploymentRoutes = require('./deployment')

const rbacMiddleware = (store, resource_type, method) => async (req, res, next) => {
  try {
    await rbac(store, req.user, {
      resource_type,
      resource_id: req.params.id,
      method,
    })
    next()
  } catch(err) {
    res.status(403)
    res.json({
      error: err.toString(),
    })
  }
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
  const deployment = DeploymentRoutes(controllers)

  app.get(basePath('/config/values'), asyncHandler(config.values))

  app.get(basePath('/user/status'), asyncHandler(user.status))
  app.get(basePath('/user/hasInitialUser'), asyncHandler(user.hasInitialUser))
  app.post(basePath('/user/login'), asyncHandler(user.login))
  app.get(basePath('/user/logout'), requireUser, asyncHandler(user.logout))

  app.get(basePath('/user'), rbacMiddleware(store, 'user', 'list'), asyncHandler(user.list))
  app.post(basePath('/user'), rbacMiddleware(store, 'user', 'create'), asyncHandler(user.create))
  app.get(basePath('/user/:id'), rbacMiddleware(store, 'user', 'get'), asyncHandler(user.get))
  app.put(basePath('/user/:id'), rbacMiddleware(store, 'user', 'update'), asyncHandler(user.update))
  app.get(basePath('/user/:id/token'), rbacMiddleware(store, 'user', 'token'), asyncHandler(user.getToken))
  app.put(basePath('/user/:id/token'), rbacMiddleware(store, 'user', 'token'), asyncHandler(user.updateToken))
  app.delete(basePath('/user/:id'), rbacMiddleware(store, 'user', 'delete'), asyncHandler(user.delete))

  app.get(basePath('/clusters'), rbacMiddleware(store, 'cluster', 'list'), asyncHandler(cluster.list))
  app.get(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.get))
  app.post(basePath('/clusters'), rbacMiddleware(store, 'cluster', 'create'), asyncHandler(cluster.create))
  app.put(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'update'), asyncHandler(cluster.update))
  app.delete(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'delete'), asyncHandler(cluster.delete))
  app.get(basePath('/clusters/:id/roles'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.listRoles))
  app.post(basePath('/clusters/:id/roles'), rbacMiddleware(store, 'cluster', 'update'), asyncHandler(cluster.createRole))
  app.delete(basePath('/clusters/:id/roles/:userid'), rbacMiddleware(store, 'cluster', 'update'), asyncHandler(cluster.deleteRole))
  app.get(basePath('/clusters/:id/tasks'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.listTasks))

  app.get(basePath('/clusters/:cluster/deployments'), rbacMiddleware(store, 'deployment', 'list'), asyncHandler(deployment.list))
}

module.exports = Routes
