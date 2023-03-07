/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-var-requires */
const { UserStore } = require('./user')
const { RoleStore } = require('./role')
const ClusterStore = require('./cluster')
const ClusterFileStore = require('./clusterfile')
const { ClusterSecretStore } = require('./clustersecret')
const DeploymentStore = require('./deployment')
const { DeploymentSecretStore } = require('./deploymentsecret')
const TaskStore = require('./task')
const { SettingsStore } = require('./settings')
const DeploymentHistoryStore = require('./deploymenthistory')

const Store = (knex) => {
  const user = new UserStore(knex)
  const role = new RoleStore(knex)
  const cluster = ClusterStore(knex)
  const clusterfile = ClusterFileStore(knex)
  const clustersecret = new ClusterSecretStore(knex)
  const deployment = DeploymentStore(knex)
  const deploymentsecret = new DeploymentSecretStore(knex)
  const task = TaskStore(knex)
  const settings = new SettingsStore(knex)
  const deploymenthistory = DeploymentHistoryStore(knex)

  const transaction = (handler) => knex.transaction(handler)

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
    settings,
    deploymenthistory,
  }
}

module.exports = Store
