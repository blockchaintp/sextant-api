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
}

module.exports = Routes
