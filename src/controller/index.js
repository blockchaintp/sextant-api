const ConfigController = require('./config')
const UserController = require('./user')

const Controllers = ({ store }) => {

  const config = ConfigController({
    store,
  })

  const user = UserController({
    store,
  })
  
  return {
    config,
    user,
  }
}

module.exports = Controllers