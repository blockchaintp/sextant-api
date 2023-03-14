import { Knex } from 'knex'
import { LIST_ORDER_BY_FIELDS, TABLES } from '../config'
import { ClusterFileStore } from './clusterfile'

export class ClusterSecretStore extends ClusterFileStore {
  constructor(knex: Knex) {
    super(knex, TABLES.clustersecret, LIST_ORDER_BY_FIELDS.clustersecret)
  }
}
