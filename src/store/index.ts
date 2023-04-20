import { Knex, knex } from 'knex'
import { Settings } from '../settings-singleton'
import { ClusterStore } from './cluster'
import { ClusterFileStore } from './clusterfile'
import { ClusterSecretStore } from './clustersecret'
import { DeploymentStore } from './deployment'
import { DeploymentHistoryStore } from './deploymenthistory'
import { DeploymentSecretStore } from './deploymentsecret'
import { HelmChartStore } from './helmchart'
import { HelmRepositoryStore } from './helmrepository'
import { RoleStore } from './role'
import { SettingsStore } from './settings'
import { TaskStore } from './task'
import { UserStore } from './user'

export class Store {
  public cluster: ClusterStore
  public clusterfile: ClusterFileStore
  public clustersecret: ClusterSecretStore
  public deployment: DeploymentStore
  public deploymenthistory: DeploymentHistoryStore
  public deploymentsecret: DeploymentSecretStore
  public helmchart: HelmChartStore
  public helmrepository: HelmRepositoryStore
  public role: RoleStore
  public settings: SettingsStore
  public task: TaskStore
  public user: UserStore

  private knex: Knex

  constructor(knex: Knex) {
    this.knex = knex
    this.user = new UserStore(knex)
    this.role = new RoleStore(knex)
    this.cluster = new ClusterStore(knex)
    this.clusterfile = new ClusterFileStore(knex)
    this.clustersecret = new ClusterSecretStore(knex)
    this.deployment = new DeploymentStore(knex)
    this.deploymentsecret = new DeploymentSecretStore(knex)
    this.task = new TaskStore(knex)
    this.settings = new SettingsStore(knex)
    this.deploymenthistory = new DeploymentHistoryStore(knex)
    this.helmrepository = new HelmRepositoryStore(knex)
    this.helmchart = new HelmChartStore(knex)
  }

  public static create(settings: Settings) {
    const db = knex(settings.postgres)
    return new Store(db)
  }

  public transaction<T>(handler: (trx: Knex.Transaction) => Promise<T> | void) {
    return this.knex.transaction(handler)
  }
}
