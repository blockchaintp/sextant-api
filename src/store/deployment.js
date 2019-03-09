const config = require('../config')
const databaseTools = require('../utils/database')

const DeploymentStore = (knex) => {

  /*
  
    list all deployments for a cluster

    params:

      * cluster
  
  */
  const list = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.deployment.list`)
    
    const orderBy = config.LIST_ORDER_BY_FIELDS.clusterfile

    knex.select('*')
      .from(config.TABLES.deployment)
      .where({
        cluster: params.cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
      .asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    get a single deployment

    params:

      * id
    
  */
  const get = (params, done) => {
    if(!params.id) return done(`id must be given to store.deployment.get`)

    knex.select('*')
      .from(config.TABLES.deployment)
      .where({
        id: params.id,
      })
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new deployment

    params:

      * data
        * cluster
        * name
        * desired_state
      
      * transaction - used if present
    
    status is set to 'created' for a new deployment

  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.deployment.create`)
    if(!params.data.cluster) return done(`data.cluster param must be given to store.deployment.create`)
    if(!params.data.name) return done(`data.name param must be given to store.deployment.create`)
    if(!params.data.desired_state) return done(`data.desired_state param must be given to store.deployment.create`)

    const insertData = {
      cluster: params.data.cluster,
      name: params.data.name,
      desired_state: params.data.desired_state,
    }

    const query = knex(config.TABLES.deployment)
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }

    query.asCallback(databaseTools.singleExtractor(done))
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
      
      * transaction - used if present
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.update`)
    if(!params.data) return done(`data param must be given to store.cluster.update`)

    const query = knex(config.TABLES.deployment)
      .where({
        id: params.id,
      })
      .update(params.data)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single deployment

    params:

      * id

      * transaction - used if present
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.deployment.delete`)

    const query = knex(config.TABLES.deployment)
      .where({
        id: params.id,
      })
      .del()
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
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