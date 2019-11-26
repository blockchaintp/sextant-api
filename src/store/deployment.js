const config = require('../config')

const DeploymentStore = (knex) => {

  /*
  
    list all deployments for a cluster

    params:

      * cluster

  */
  const list = ({
    cluster,
    deleted,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.deployment.list`)
    
    const orderBy = config.LIST_ORDER_BY_FIELDS.clusterfile

    const sqlQuery = (trx || knex).select('*')
      .from(config.TABLES.deployment)

    if(cluster != 'all') {
      sqlQuery.where({
        cluster,
      })
    }
     
    sqlQuery.orderBy('status', 'desc').orderBy('cluster', 'asc')

    if(!deleted) {
      sqlQuery.andWhereNot({
        status: config.CLUSTER_STATUS.deleted,
      })
    }

    return sqlQuery
  }

  /*
  
    get a single deployment

    params:

      * id

  */
  const get = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.deployment.get`)

    return (trx || knex).select('*')
      .from(config.TABLES.deployment)
      .where({
        id,
      })
      .first()
  }

  /*
  
    insert a new deployment

    params:

      * data
        * cluster
        * deployment_type
        * name
        * desired_state
    
    status is set to 'created' for a new deployment

  */
  const create = ({
    data: {
      cluster,
      name,
      deployment_type,
      deployment_version,
      desired_state,
    }
  }, trx) => {
    if(!cluster) throw new Error(`data.cluster param must be given to store.deployment.create`)
    if(!name) throw new Error(`data.name param must be given to store.deployment.create`)
    if(!deployment_type) throw new Error(`data.deployment_type param must be given to store.deployment.create`)
    if(!deployment_version) throw new Error(`data.deployment_version param must be given to store.deployment.create`)
    if(!desired_state) throw new Error(`data.desired_state param must be given to store.deployment.create`)

    return (trx || knex)(config.TABLES.deployment)
      .insert({
        cluster,
        name,
        deployment_type,
        deployment_version,
        desired_state,
      })
      .returning('*')
      .get(0)
  }

  /*
  
    update a deployment

    params:

      * id
      * data (all optional)
        * name
        * status
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
    return (trx || knex)(config.TABLES.deployment)
      .where({
        id,
      })
      .update(data)
      .returning('*')
      .get(0)
  }

  /*
  
    delete a single deployment

    params:

      * id

  */
  const del = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.deployment.delete`)

    return (trx || knex)(config.TABLES.deployment)
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
  }
}

module.exports = DeploymentStore