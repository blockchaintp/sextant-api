const ConfigBackend = require('./config')
const ClusterBackend = require('./cluster')

const Backends = ({ store }) => {

  const config = ConfigBackend({
    store,
  })

  const cluster = ClusterBackend({
    store,
  })
  
  return {
    config,
    cluster,
  }
}

module.exports = Backends