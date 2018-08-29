'use strict'

const ConfigRoutes = require('./config')
const settings = require('../settings')

const basePath = (path) => `${settings.baseUrl}${path}`

const Routes = (app, backends) => {

  const config = ConfigRoutes(backends)
  
  app.get(basePath('/config/version'), config.version)
  app.get(basePath('/config/values'), config.values)
}

module.exports = Routes
