/* eslint-disable camelcase */
import { Knex } from 'knex'
import { TABLES, CLUSTER_STATUS } from '../config'
import { Cluster } from './model/model-types'
import { DatabaseIdentifier } from './model/scalar-types'
import {
  ClusterCreateRequest,
  ClusterDeletePermanentlyRequest,
  ClusterDeleteRequest,
  ClusterGetRequest,
  ClusterListRequest,
  ClusterUpdateRequest,
} from './signals'

export type ClusterIdentifying = { id: DatabaseIdentifier }

export class ClusterStore {
  private knex: Knex

  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new cluster
    params:
      * data
        * name
        * provision_type
        * capabilities
        * desired_state
  */
  public async create(
    { data: { name, provision_type, capabilities, desired_state, status } }: ClusterCreateRequest,
    trx?: Knex.Transaction
  ) {
    if (!name) throw new Error('data.name param must be given to store.cluster.create')
    if (!provision_type) throw new Error('data.provision_type param must be given to store.cluster.create')
    if (!desired_state) throw new Error('data.desired_state param must be given to store.cluster.create')

    const [result] = await (trx || this.knex)<Cluster>(TABLES.cluster)
      .insert({
        name,
        provision_type,
        capabilities,
        desired_state,
        status,
      })
      .returning('*')

    return result
  }

  /*
    delete a single cluster
    this means updating the 'deleted' flag to true
    params:
      * id
  */
  public async delete({ id }: ClusterDeleteRequest, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.delete')

    const [result] = await (trx || this.knex)<Cluster>(TABLES.cluster)
      .where({
        id,
      })
      .update({
        status: CLUSTER_STATUS.deleted,
      })
      .returning('*')
    return result
  }

  public async deletePermanently({ id }: ClusterDeletePermanentlyRequest, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.deletePermanently')

    const [result] = await (trx || this.knex)<Cluster>(TABLES.cluster)
      .where({
        id,
      })
      .del()
      .returning('*')
    return result
  }

  /*
    get a single cluster
    params:
  */
  public get({ id }: ClusterGetRequest, trx?: Knex.Transaction): Promise<Cluster> {
    if (!id) throw new Error('id must be given to store.cluster.get')
    return (trx || this.knex)<Cluster>(TABLES.cluster)
      .where(`${TABLES.cluster}.id`, id)
      .select(`${TABLES.cluster}.*`)
      .count(`${TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(TABLES.deployment, function () {
        this.on(`${TABLES.cluster}.id`, '=', `${TABLES.deployment}.cluster`).onNotIn(`${TABLES.deployment}.status`, [
          'deleted',
        ])
      })
      .groupBy(`${TABLES.cluster}.id`)
      .first<Cluster>()
  }

  /*
    list all clusters
    params:
  */
  public list({ deleted }: ClusterListRequest, trx?: Knex.Transaction) {
    let sqlQuery = (trx || this.knex)<Cluster>(TABLES.cluster)
      .select(`${TABLES.cluster}.*`)
      .count(`${TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(TABLES.deployment, function () {
        this.on(`${TABLES.cluster}.id`, '=', `${TABLES.deployment}.cluster`).onNotIn(`${TABLES.deployment}.status`, [
          'deleted',
        ])
      })
      .groupBy(`${TABLES.cluster}.id`)

    if (!deleted) {
      sqlQuery = sqlQuery.whereNot(`${TABLES.cluster}.status`, CLUSTER_STATUS.deleted)
    }

    return sqlQuery.returning<Cluster[]>('*')
  }

  /*
    update a cluster
    params:
      * id
      * data (all optional)
        * name
        * status
        * capabilities
        * desired_state
        * applied_state
        * maintenance_flag
  */
  public async update({ id, data }: ClusterUpdateRequest, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')

    const [result] = await (trx || this.knex)<Cluster>(TABLES.cluster)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    return result
  }
}
