const ConfigRoutes = require('./config')
const ClusterRoutes = require('./cluster')
const settings = require('../settings')

const basePath = (path) => `${settings.baseUrl}${path}`

const Routes = (app, backends) => {

  const config = ConfigRoutes(backends)
  const cluster = ClusterRoutes(backends)
  
  app.get(basePath('/config/version'), config.version)
  app.get(basePath('/config/values'), config.values)
  app.get(basePath('/config/aws'), config.aws)

  app.get(basePath('/cluster'), cluster.list)
  app.get(basePath('/cluster/:id'), cluster.get)
  app.post(basePath('/cluster'), cluster.create)
  app.delete(basePath('/cluster/:id'), cluster.destroy)
  app.put(basePath('/cluster/cleanup/:id'), cluster.cleanup)
  app.put(basePath('/cluster/deploy/:id'), cluster.deploy)
  app.get(basePath('/cluster/status/:id'), cluster.status)
  app.get(basePath('/cluster/kubeconfig/:id'), cluster.kubeconfig)
  app.get(basePath('/cluster/kopsconfig/:id'), cluster.kopsconfig)
  app.get(basePath('/test'), cluster.test)
  
  app.post(basePath('/cluster/keypair/create'), cluster.createKeypair)
}

module.exports = Routes
