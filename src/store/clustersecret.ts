import { Knex } from 'knex'
import * as config from '../config'
import { ClusterFileStore } from './clusterfile'

export class ClusterSecretStore extends ClusterFileStore {
  constructor(knex: Knex) {
    super(knex, config.TABLES.clustersecret, config.LIST_ORDER_BY_FIELDS.clustersecret)
  }
}
