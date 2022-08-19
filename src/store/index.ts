import { Knex } from 'knex'
import ClusterStore from './cluster'
import ClusterFileStore from './clusterfile'
import ClusterSecretStore from './clustersecret'
import DeploymentStore from './deployment'
import DeploymentHistoryStore from './deploymenthistory'
import DeploymentSecretStore from './deploymentsecret'
import RoleStore from './role'
import SettingsStore from './settings'
import TaskStore from './task'
import UserStore from './user'

const Store = (knex: Knex) => {
  const user = UserStore(knex)
  const role = RoleStore(knex)
  const cluster = ClusterStore(knex)
  const clusterfile = ClusterFileStore(knex)
  const clustersecret = ClusterSecretStore(knex)
  const deployment = DeploymentStore(knex)
  const deploymentsecret = DeploymentSecretStore(knex)
  const task = TaskStore(knex)
  const settings = SettingsStore(knex)
  const deploymenthistory = DeploymentHistoryStore(knex)

  const transaction = <T>(handler: (trx: Knex.Transaction) => Promise<T> | void) => knex.transaction(handler)

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

export default Store
