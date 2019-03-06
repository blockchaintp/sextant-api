const ConfigRoutes = require('./config')
const UserRoutes = require('./user')
const userUtils = require('../utils/user')

const { 
  requireUser,
  addUserAuthHandler,
} = userUtils

const Routes = ({
  app,
  controllers,
  settings,
}) => {

  const basePath = (path) => `${settings.baseUrl}${path}`

  const config = ConfigRoutes(controllers)
  const user = UserRoutes(controllers)
  
  app.get(basePath('/config/version'), config.version)
  app.get(basePath('/config/values'), config.values)

  app.get(basePath('/user'), requireUser('admin'), user.list)
  app.get(basePath('/user/status'), user.status)
  app.post(basePath('/user/login'), user.login)
  app.get(basePath('/user/logout'), requireUser(), user.logout)
  app.post(basePath('/user'), addUserAuthHandler(controllers.user), user.create)
  app.get(basePath('/user/:username'), requireUser('admin'), user.get)
  app.put(basePath('/user/:username'), requireUser('admin'), user.update)
  app.delete(basePath('/user/:username'), requireUser('admin'), user.del)
}

module.exports = Routes
