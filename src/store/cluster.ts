import { Knex } from 'knex'
import { TABLES, CLUSTER_STATUS } from '../config'
import { ClusterCreateRequest, ClusterStoreOptions, ClusterUpdateRequest, IDBasedRequest } from './types'

const ClusterStore = (knex: Knex) => {
  /*

    list all clusters

    params:

  */
  const list = ({ deleted }: ClusterStoreOptions, trx: Knex | Knex.Transaction) => {
    const sqlQuery = (trx || knex)(TABLES.cluster)
      .select(`${TABLES.cluster}.*`)
      .count(`${TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(TABLES.deployment, function () {
        this.on(`${TABLES.cluster}.id`, '=', `${TABLES.deployment}.cluster`).onNotIn(`${TABLES.deployment}.status`, [
          'deleted',
        ])
      })
      .groupBy(`${TABLES.cluster}.id`)

    if (!deleted) {
      sqlQuery.whereNot(`${TABLES.cluster}.status`, CLUSTER_STATUS.deleted)
    }

    return sqlQuery
  }

  /*

    get a single cluster

    params:

  */
  const get = ({ id }: IDBasedRequest, trx: Knex | Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.cluster.get')
    return (trx || knex)(TABLES.cluster)
      .where(`${TABLES.cluster}.id`, id)
      .select(`${TABLES.cluster}.*`)
      .count(`${TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(TABLES.deployment, function () {
        this.on(`${TABLES.cluster}.id`, '=', `${TABLES.deployment}.cluster`).onNotIn(`${TABLES.deployment}.status`, [
          'deleted',
        ])
      })
      .groupBy(`${TABLES.cluster}.id`)
      .first()
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
  const create = async (
    { data: { name, provision_type, capabilities, desired_state } }: ClusterCreateRequest,
    trx: Knex | Knex.Transaction
  ) => {
    if (!name) throw new Error('data.name param must be given to store.cluster.create')
    if (!provision_type) throw new Error('data.provision_type param must be given to store.cluster.create')
    if (!desired_state) throw new Error('data.desired_state param must be given to store.cluster.create')

    const [result] = await (trx || knex)(TABLES.cluster)
      .insert({
        name,
        provision_type,
        capabilities,
        desired_state,
      })
      .returning('*')

    return result
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
  const update = async ({ id, data }: ClusterUpdateRequest, trx: Knex | Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')

    const [result] = await (trx || knex)(TABLES.cluster)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    return result
  }

  /*

    delete a single cluster

    this means updating the 'deleted' flag to true

    params:

      * id

  */
  const del = async ({ id }: IDBasedRequest, trx: Knex | Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.cluster.delete')

    const [result] = await (trx || knex)(TABLES.cluster)
      .where({
        id,
      })
      .update({
        status: CLUSTER_STATUS.deleted,
      })
      .returning('*')
    return result
  }

  const deletePermanently = async ({ id }: IDBasedRequest, trx: Knex | Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.cluster.deletePermanently')

    const [result] = await (trx || knex)(TABLES.cluster)
      .where({
        id,
      })
      .del()
      .returning('*')
    return result
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    deletePermanently,
  }
}

export default ClusterStore
