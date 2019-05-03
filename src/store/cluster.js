const config = require('../config')
const databaseTools = require('../utils/database')

const ClusterStore = (knex) => {

  /*
  
    list all clusters

    params:

      * deleted - include the deleted clusters in the list

      * transaction - used if present
  
  */
  const list = (params, done) => {

    const orderBy = config.LIST_ORDER_BY_FIELDS.cluster

    const sqlQuery = knex.select('*')
      .from(config.TABLES.cluster)
      .orderBy(orderBy.field, orderBy.direction)

    if(!params.deleted) {
      sqlQuery.whereNot({
        status: config.CLUSTER_STATUS.deleted,
      })
    }

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }

    sqlQuery.asCallback(databaseTools.allExtractor(done))
  }
  
  /*
  
    get a single cluster

    params:

      * id

      * transaction - used if present
    
  */
  const get = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.get`)

    const sqlQuery = knex.select('*')
      .from(config.TABLES.cluster)
      .where({
        id: params.id,
      })

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }

    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new cluster

    params:

      * data
        * name
        * provision_type
        * capabilities
        * desired_state
      
      * transaction - used if present
    
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.cluster.create`)
    if(!params.data.name) return done(`data.name param must be given to store.cluster.create`)
    if(!params.data.provision_type) return done(`data.provision_type param must be given to store.cluster.create`)
    if(!params.data.desired_state) return done(`data.desired_state param must be given to store.cluster.create`)

    const insertData = {
      name: params.data.name,
      provision_type: params.data.provision_type,
      capabilities: params.data.capabilities,
      desired_state: params.data.desired_state,
    }

    const sqlQuery = knex(config.TABLES.cluster)
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }

    sqlQuery.asCallback(databaseTools.singleExtractor(done))
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
        
        * transaction - used if present
  
  */
  const update = (params, done) => {

    const {
      id,
      data,
    } = params

    if(!id) return done(`id must be given to store.cluster.update`)
    if(!data) return done(`data param must be given to store.cluster.update`)

    const sqlQuery = knex(config.TABLES.cluster)
      .where({
        id: params.id,
      })
      .update(data)
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single cluster

    this means updating the 'deleted' flag to true

    params:

      * id

      * transaction - used if present
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.delete`)
    
    const sqlQuery = knex(config.TABLES.cluster)
      .where({
        id: params.id,
      })
      .update({
        status: config.CLUSTER_STATUS.deleted,
      })
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
  }
}

module.exports = ClusterStore