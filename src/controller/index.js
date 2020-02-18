/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const ConfigController = require('./config')
const UserController = require('./user')
const ClusterController = require('./cluster')
const DeploymentController = require('./deployment')

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

  return {
    config,
    user,
    cluster,
    deployment,
  }
}

module.exports = Controllers
