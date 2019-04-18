const config = require('../config')
const databaseTools = require('../utils/database')
const base64 = require('../utils/base64')

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

const ClusterSecretStore = (knex) => {

  /*
  
    list all secrets for a single cluster

    params:

      * cluster
  
  */
  const list = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clustersecret.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.clustersecret

    knex.select('*')
      .from(config.TABLES.clustersecret)
      .where({
        cluster: params.cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
      .asCallback(databaseTools.allExtractor(done))
  }
  
  /*
  
    get a single secret for a single cluster

    params:

      * cluster
      * id or name
    
  */
  const get = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clustersecret.get`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clustersecret.get`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name

    knex.select('*')
      .from(config.TABLES.clustersecret)
      .where(queryParams)
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new clustersecret

    params:

      * data
        * cluster
        * name
        * rawData
      
      * transaction - used if present
    
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.clustersecret.create`)
    if(!params.data.cluster) return done(`data.cluster param must be given to store.clustersecret.create`)
    if(!params.data.name) return done(`data.name param must be given to store.clustersecret.create`)
    if(!params.data.rawData) return done(`data.rawData param must be given to store.clustersecret.create`)

    const insertData = {
      cluster: params.data.cluster,
      name: params.data.name,
      base64data: base64.encode(params.data.rawData),
    }

    const query = knex(config.TABLES.clustersecret)
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }

    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a clustersecret

    params:

      * cluster
      * id or name
      * data
        * rawData
        
      * transaction - used if present
  
  */
  const update = (params, done) => {

    if(!params.cluster) return done(`cluster must be given to store.clustersecret.update`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clustersecret.update`)
    if(!params.data) return done(`data param must be given to store.clustersecret.update`)
    if(!params.data.rawData) return done(`data.rawData param must be given to store.clustersecret.update`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name

    const query = knex(config.TABLES.clustersecret)
      .where(queryParams)
      .update({
        base64data: base64.encode(params.data.rawData),
      })
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single clustersecret

    params:

      * cluster
      * id or name

      * transaction - used if present
    
  */
  const del = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clustersecret.del`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clustersecret.del`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name
    
    const query = knex(config.TABLES.clustersecret)
      .where(queryParams)
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

module.exports = ClusterSecretStore