const UserStore = require('./user')
const RoleStore = require('./role')
const ClusterStore = require('./cluster')
const ClusterFileStore = require('./clusterfile')
const ClusterSecretStore = require('./clustersecret')
const DeploymentStore = require('./deployment')
const DeploymentSecretStore = require('./deploymentsecret')
const TaskStore = require('./task')

const Store = (knex) => {
  const user = UserStore(knex)
  const role = RoleStore(knex)
  const cluster = ClusterStore(knex)
  const clusterfile = ClusterFileStore(knex)
  const clustersecret = ClusterSecretStore(knex)
  const deployment = DeploymentStore(knex)
  const deploymentsecret = DeploymentSecretStore(knex)
  const task = TaskStore(knex)

  const transaction = knex.transaction

  return {
    knex,
    user,
    role,
    cluster,
    clusterfile,
    clustersecret,
    deployment,
    deploymentsecret,
    task,
    transaction,
  }
}

module.exports = Store