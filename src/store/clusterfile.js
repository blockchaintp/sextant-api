const config = require('../config')
const databaseTools = require('../utils/database')
const base64 = require('../utils/base64')

const ClusterFileStore = (knex) => {

  /*
  
    list all files for a single cluster

    params:

      * cluster

      * transaction - used if present
  
  */
  const list = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clusterfile.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.clusterfile

    const sqlQuery = knex.select('*')
      .from(config.TABLES.clusterfile)
      .where({
        cluster: params.cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.allExtractor(done))
  }
  
  /*
  
    get a single file for a single cluster

    params:

      * cluster
      * id or name
      
      * transaction - used if present
    
  */
  const get = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clusterfile.get`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clusterfile.get`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name

    const sqlQuery = knex.select('*')
      .from(config.TABLES.clusterfile)
      .where(queryParams)

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }

    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new clusterfile

    params:

      * data
        * cluster
        * name
        * rawData
        * base64Data
      
      * transaction - used if present
    
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.clusterfile.create`)
    if(!params.data.cluster) return done(`data.cluster param must be given to store.clusterfile.create`)
    if(!params.data.name) return done(`data.name param must be given to store.clusterfile.create`)
    if(!params.data.rawData && !params.data.base64Data) return done(`data.rawData or data.base64Data param must be given to store.clusterfile.create`)

    const insertData = {
      cluster: params.data.cluster,
      name: params.data.name,
      base64data: params.data.base64Data || base64.encode(params.data.rawData),
    }

    const sqlQuery = knex(config.TABLES.clusterfile)
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }

    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a clusterfile

    params:

      * cluster
      * id or name
      * data
        * rawData
        
      * transaction - used if present
  
  */
  const update = (params, done) => {

    if(!params.cluster) return done(`cluster must be given to store.clusterfile.update`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clusterfile.update`)
    if(!params.data) return done(`data param must be given to store.clusterfile.update`)
    if(!params.data.rawData && !params.data.base64Data) return done(`data.rawData or data.base64Data param must be given to store.clusterfile.update`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name

    const sqlQuery = knex(config.TABLES.clusterfile)
      .where(queryParams)
      .update({
        base64data: params.data.base64Data || base64.encode(params.data.rawData),
      })
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single clusterfile

    params:

      * cluster
      * id or name

      * transaction - used if present
    
  */
  const del = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clusterfile.get`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clusterfile.get`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name
    
    const sqlQuery = knex(config.TABLES.clusterfile)
      .where(queryParams)
      .del()
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

module.exports = ClusterFileStore