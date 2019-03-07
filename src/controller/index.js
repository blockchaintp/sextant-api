const ConfigController = require('./config')
const UserController = require('./user')
const ClusterController = require('./cluster')

const Controllers = ({ 
  store,
  settings,
}) => {

  const config = ConfigController({
    store,
    settings,
  })

  const user = UserController({
    store,
    settings,
  })

  const cluster = ClusterController({
    store,
    settings,
  })
  
  return {
    config,
    user,
    cluster,
  }
}

module.exports = Controllers