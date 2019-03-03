const ConfigBackend = require('./config')
const UserBackend = require('./user')

const Backends = ({ store }) => {

  const config = ConfigBackend({
    store,
  })

  const user = UserBackend({
    store,
  })
  
  return {
    config,
    user,
  }
}

module.exports = Backends