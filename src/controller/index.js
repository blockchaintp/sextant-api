/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
const { ConfigBackend } = require('./config')
const { UserController } = require('./user')
const { ClusterController } = require('./cluster')
const { DeploymentController } = require('./deployment')
const DamlController = require('./daml')
const { TaekionController } = require('./taekion')
const { AdministrationController } = require('./administration')

const Controllers = ({ store, settings }) => {
  const config = new ConfigBackend({
    store,
    settings,
  })

  const user = new UserController({
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

  const taekion = new TaekionController({
    store,
    settings,
  })

  const administration = new AdministrationController()

  return {
    config,
    user,
    cluster,
    deployment,
    daml,
    taekion,
    administration,
  }
}

module.exports = Controllers
