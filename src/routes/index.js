const ConfigRoutes = require('./config')
const ClusterRoutes = require('./cluster')
const UserRoutes = require('./user')
const settings = require('../settings')

const basePath = (path) => `${settings.baseUrl}${path}`

const requireUser = (type) => (req, res, next) => {
  if(!req.user) {
    res
      .status(403)
      .json({
        error: 'user account required'
      })
    return
  }
  if(type && req.user.type != type) {
    res
      .status(403)
      .json({
        error: `user account of type ${type} required`
      })
    return
  }
  next()
}

// if there are no users - then allow a non-logged in user
// to create a new user - otherwise they must be an admin
const addUserAuthHandler = (userBackend) => (req, res, next) => {
  const adminHandler = requireUser('admin')

  userBackend.count({}, (err, userCount) => {
    if(err) return next(err)
    if(userCount <= 0) return next()
    adminHandler(req, res, next)
  })
}

const Routes = (app, backends) => {

  const config = ConfigRoutes(backends)
  const cluster = ClusterRoutes(backends)
  const user = UserRoutes(backends)
  
  app.get(basePath('/config/version'), config.version)
  app.get(basePath('/config/values'), config.values)
  app.get(basePath('/config/aws'), config.aws)

  app.get(basePath('/user'), requireUser('admin'), user.list)
  app.get(basePath('/user/status'), user.status)
  app.post(basePath('/user/login'), user.login)
  app.get(basePath('/user/logout'), requireUser(), user.logout)
  app.post(basePath('/user'), addUserAuthHandler(backends.user), user.create)
  app.get(basePath('/user/:username'), requireUser('admin'), user.get)
  app.put(basePath('/user/:username'), requireUser('admin'), user.update)

  app.get(basePath('/cluster'), requireUser(), cluster.list)
  app.get(basePath('/cluster/:id'), requireUser(), cluster.get)
  app.post(basePath('/cluster'), requireUser(), cluster.create)
  app.delete(basePath('/cluster/:id'), requireUser(), cluster.destroy)
  app.put(basePath('/cluster/cleanup/:id'), requireUser(), cluster.cleanup)
  app.put(basePath('/cluster/undeploy/:id'), requireUser(), cluster.undeploy)
  app.get(basePath('/cluster/status/:id'), requireUser(), cluster.status)
  app.get(basePath('/cluster/info/:id'), requireUser(), cluster.info)
  app.get(basePath('/cluster/kubeconfig/:id'), requireUser(), cluster.kubeconfig)
  app.get(basePath('/cluster/kopsconfig/:id'), requireUser(), cluster.kopsconfig)
  app.post(basePath('/cluster/keypair/create'), requireUser(), cluster.createKeypair)
  app.post(basePath('/cluster/deploy/:id'), requireUser(), cluster.deploy)
}

module.exports = Routes
