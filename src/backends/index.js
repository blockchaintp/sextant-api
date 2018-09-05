const ConfigBackend = require('./config')
const ClusterBackend = require('./cluster')

const Backends = ({ store, jobDispatcher }) => {

  const config = ConfigBackend({
    store,
    jobDispatcher,
  })

  const cluster = ClusterBackend({
    store,
    jobDispatcher,
  })
  
  return {
    config,
    cluster,
  }
}

module.exports = Backends