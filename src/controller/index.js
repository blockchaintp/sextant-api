const ConfigController = require('./config')
const UserController = require('./user')

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
  
  return {
    config,
    user,
  }
}

module.exports = Controllers