const UserStore = require('./user')
const RoleStore = require('./role')
const ClusterStore = require('./cluster')
const DeploymentStore = require('./deployment')

const Store = (knex) => {
  const user = UserStore(knex)
  const role = RoleStore(knex)
  const cluster = ClusterStore(knex)
  const deployment = DeploymentStore(knex)

  return {
    user,
    role,
    cluster,
    deployment,
  }
}

module.exports = Store