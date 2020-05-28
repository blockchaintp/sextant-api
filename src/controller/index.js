const ConfigController = require('./config')
const UserController = require('./user')
const ClusterController = require('./cluster')
const DeploymentController = require('./deployment')
const DamlController = require('./daml')
const TaekionController = require('./taekion')

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

  const deployment = DeploymentController({
    store,
    settings,
  })

  const daml = DamlController({
    store,
    settings,
  })

  const taekion = TaekionController({
    store,
    settings,
  })
  
  return {
    config,
    user,
    cluster,
    deployment,
    daml,
    taekion,
  }
}

module.exports = Controllers