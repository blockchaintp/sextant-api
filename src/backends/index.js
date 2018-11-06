const ConfigBackend = require('./config')
const ClusterBackend = require('./cluster')
const UserBackend = require('./user')

const Backends = ({ store, jobDispatcher }) => {

  const config = ConfigBackend({
    store,
    jobDispatcher,
  })

  const cluster = ClusterBackend({
    store,
    jobDispatcher,
  })

  const user = UserBackend({
    store,
    jobDispatcher,
  })
  
  return {
    config,
    cluster,
    user,
  }
}

module.exports = Backends