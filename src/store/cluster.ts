import { Knex } from 'knex'
import * as config from '../config'

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
  public async create({ data: { name, provision_type, capabilities, desired_state, status } }, trx: Knex.Transaction) {
    if (!name) throw new Error('data.name param must be given to store.cluster.create')
    if (!provision_type) throw new Error('data.provision_type param must be given to store.cluster.create')
    if (!desired_state) throw new Error('data.desired_state param must be given to store.cluster.create')

    const [result] = await (trx || this.knex)(config.TABLES.cluster)
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
  public async delete({ id }: { id: number }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.delete')

    const [result] = await (trx || this.knex)(config.TABLES.cluster)
      .where({
        id,
      })
      .update({
        status: config.CLUSTER_STATUS.deleted,
      })
      .returning('*')
    return result
  }

  public async deletePermanently({ id }: { id: number }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.deletePermanently')

    const [result] = await (trx || this.knex)(config.TABLES.cluster)
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
  public get({ id }: { id: number }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.get')
    return (trx || this.knex)(config.TABLES.cluster)
      .where(`${config.TABLES.cluster}.id`, id)
      .select(`${config.TABLES.cluster}.*`)
      .count(`${config.TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(config.TABLES.deployment, function () {
        this.on(`${config.TABLES.cluster}.id`, '=', `${config.TABLES.deployment}.cluster`).onNotIn(
          `${config.TABLES.deployment}.status`,
          ['deleted']
        )
      })
      .groupBy(`${config.TABLES.cluster}.id`)
      .first()
  }

  /*
    list all clusters
    params:
  */
  public list({ deleted }: { deleted: boolean }, trx: Knex.Transaction) {
    let sqlQuery = (trx || this.knex)(config.TABLES.cluster)
      .select(`${config.TABLES.cluster}.*`)
      .count(`${config.TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(config.TABLES.deployment, function () {
        this.on(`${config.TABLES.cluster}.id`, '=', `${config.TABLES.deployment}.cluster`).onNotIn(
          `${config.TABLES.deployment}.status`,
          ['deleted']
        )
      })
      .groupBy(`${config.TABLES.cluster}.id`)

    if (!deleted) {
      sqlQuery = sqlQuery.whereNot(`${config.TABLES.cluster}.status`, config.CLUSTER_STATUS.deleted)
    }

    return sqlQuery
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
  public async update({ id, data }: { id: number; data: any }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')

    const [result] = await (trx || this.knex)(config.TABLES.cluster)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    return result
  }
}
