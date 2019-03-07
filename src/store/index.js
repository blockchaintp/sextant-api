const databaseTools = require('../utils/database')
const UserStore = require('./user')
const RoleStore = require('./role')
const ClusterStore = require('./cluster')
const DeploymentStore = require('./deployment')

const Store = (knex) => {
  const user = UserStore(knex)
  const role = RoleStore(knex)
  const cluster = ClusterStore(knex)
  const deployment = DeploymentStore(knex)

  const transaction = (handler, done) => databaseTools.transaction(knex, handler, done)

  return {
    user,
    role,
    cluster,
    deployment,
    transaction,
  }
}

module.exports = Store