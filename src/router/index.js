const asyncHandler = require('express-async-handler')
const pino = require('pino')({
  name: 'app',
})
const rbac = require('../rbac')

const ConfigRoutes = require('./config')
const UserRoutes = require('./user')
const ClusterRoutes = require('./cluster')
const DeploymentRoutes = require('./deployment')

const RbacMiddleware = (settings) => (store, resource_type, method) => async (req, res, next) => {
  try {
    const canAccess = await rbac(store, req.user, {
      resource_type,
      resource_id: req.params.id,
      method,
    })

    if(canAccess) {
      next()
    }
    else {
      res.status(403)
      res.json({
        error: 'Error: access denied',
      })
    }
  } catch(err) {
    if(settings.logging) {
      pino.error({
        action: 'error',
        error: err.error ? err.error.toString() : err.toString(),
        stack: err.stack,
      })
    }
    next(err)
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

  const rbacMiddleware = RbacMiddleware(settings)
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
  app.get(basePath('/user/search'), requireUser, asyncHandler(user.search))
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
  app.get(basePath('/clusters/:id/resources'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.resources))
  app.get(basePath('/clusters/:id/summary'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.summary))

  app.get(basePath('/clusters/:cluster/deployments'), rbacMiddleware(store, 'deployment', 'list'), asyncHandler(deployment.list))
  app.get(basePath('/clusters/:cluster/deployments/:id'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.get))
  app.post(basePath('/clusters/:cluster/deployments'), rbacMiddleware(store, 'deployment', 'create'), asyncHandler(deployment.create))
  app.put(basePath('/clusters/:cluster/deployments/:id'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.update))
  app.delete(basePath('/clusters/:cluster/deployments/:id'), rbacMiddleware(store, 'deployment', 'delete'), asyncHandler(deployment.delete))
  app.get(basePath('/clusters/:cluster/deployments/:id/roles'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.listRoles))
  app.post(basePath('/clusters/:cluster/deployments/:id/roles'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.createRole))
  app.delete(basePath('/clusters/:cluster/deployments/:id/roles/:userid'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.deleteRole))
  app.get(basePath('/clusters/:cluster/deployments/:id/tasks'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.listTasks))
  app.get(basePath('/clusters/:cluster/deployments/:id/resources'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.resources))
  app.get(basePath('/clusters/:cluster/deployments/:id/summary'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.summary))

  app.get(basePath('/clusters/:cluster/deployments/:id/keyManagerKeys'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.getKeyManagerKeys))
  app.get(basePath('/clusters/:cluster/deployments/:id/enrolledKeys'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.getEnrolledKeys))
  app.post(basePath('/clusters/:cluster/deployments/:id/enrolledKeys'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.addEnrolledKey))

  app.get(basePath('/clusters/:cluster/deployments/:id/participants'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.getParticipants))
  app.get(basePath('/clusters/:cluster/deployments/:id/archives'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.getArchives))
  app.get(basePath('/clusters/:cluster/deployments/:id/timeServiceInfo'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.getTimeServiceInfo))

  app.post(basePath('/clusters/:cluster/deployments/:id/registerParticipant'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.registerParticipant))
  app.post(basePath('/clusters/:cluster/deployments/:id/rotateKeys'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.rotateParticipantKey))
  app.post(basePath('/clusters/:cluster/deployments/:id/addParty'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.addParty))
  app.post(basePath('/clusters/:cluster/deployments/:id/removeParties'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.removeParties))
  app.post(basePath('/clusters/:cluster/deployments/:id/generatePartyToken'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.generatePartyToken))
  app.post(basePath('/clusters/:cluster/deployments/:id/uploadArchive'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.uploadArchive))

}

module.exports = Routes
