const databaseTools = require('../utils/database')
const UserStore = require('./user')
const RoleStore = require('./role')
const ClusterStore = require('./cluster')
const DeploymentStore = require('./deployment')
const TaskStore = require('./task')

const Store = (knex) => {
  const user = UserStore(knex)
  const role = RoleStore(knex)
  const cluster = ClusterStore(knex)
  const deployment = DeploymentStore(knex)
  const task = TaskStore(knex)

  const transaction = (handler, done) => databaseTools.transaction(knex, handler, done)

  return {
    user,
    role,
    cluster,
    deployment,
    task,
    transaction,
  }
}

module.exports = Store