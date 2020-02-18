/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const config = require('../config')

const ClusterStore = (knex) => {

  /*

    list all clusters

    params:

  */
  const list = ({
    deleted,
  }, trx) => {

    const orderBy = config.LIST_ORDER_BY_FIELDS.cluster

    const sqlQuery = (trx || knex)(config.TABLES.cluster)
      .select(`${config.TABLES.cluster}.*`)
      .count(`${config.TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(config.TABLES.deployment, function () {
        this.on(`${config.TABLES.cluster}.id`, '=', `${config.TABLES.deployment}.cluster`).onNotIn(`${config.TABLES.deployment}.status`, ['deleted'])
      })
      .groupBy(`${config.TABLES.cluster}.id`)

    if(!deleted) {
      sqlQuery.whereNot(
        `${config.TABLES.cluster}.status`, config.CLUSTER_STATUS.deleted
      )
    }

    sqlQuery.orderBy('status', 'desc').orderBy('name', 'asc')

    return sqlQuery
  }

  /*

    get a single cluster

    params:

  */
  const get = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.cluster.get`)
    return (trx || knex)(config.TABLES.cluster).where(
      `${config.TABLES.cluster}.id`, id
    ).select(`${config.TABLES.cluster}.*`)
      .count(`${config.TABLES.deployment}.id as active_deployments`)
      .leftOuterJoin(config.TABLES.deployment, function () {
        this.on(`${config.TABLES.cluster}.id`, '=', `${config.TABLES.deployment}.cluster`).onNotIn(`${config.TABLES.deployment}.status`, ['deleted'])
      })
      .groupBy(`${config.TABLES.cluster}.id`)
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
  const create = ({
    data: {
      name,
      provision_type,
      capabilities,
      desired_state,
    }
  }, trx) => {

    if(!name) throw new Error(`data.name param must be given to store.cluster.create`)
    if(!provision_type) throw new Error(`data.provision_type param must be given to store.cluster.create`)
    if(!desired_state) throw new Error(`data.desired_state param must be given to store.cluster.create`)

    return (trx || knex)(config.TABLES.cluster)
      .insert({
        name,
        provision_type,
        capabilities,
        desired_state,
      })
      .returning('*')
      .get(0)
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
  const update = ({
    id,
    data,
  }, trx) => {

    if(!id) throw new Error(`id must be given to store.cluster.update`)
    if(!data) throw new Error(`data param must be given to store.cluster.update`)

    return (trx || knex)(config.TABLES.cluster)
      .where({
        id,
      })
      .update(data)
      .returning('*')
      .get(0)
  }

  /*

    delete a single cluster

    this means updating the 'deleted' flag to true

    params:

      * id

  */
  const del = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.cluster.delete`)

    return (trx || knex)(config.TABLES.cluster)
      .where({
        id,
      })
      .update({
        status: config.CLUSTER_STATUS.deleted,
      })
      .returning('*')
      .get(0)
  }

  const deletePermenantly = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.cluster.deletePermenantly`)

    return (trx || knex)(config.TABLES.cluster)
      .where({
        id,
      })
      .del()
      .returning('*')
      .get(0)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    deletePermenantly,
  }
}

module.exports = ClusterStore
