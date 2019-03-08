const databaseTools = require('../utils/database')

const ClusterFileStore = (knex) => {

  /*
  
    list all files for a single cluster

    params:

      * cluster
  
  */
  const list = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clusterfile.list`)
    knex.select('*')
      .from('clusterfile')
      .where({
        cluster: params.cluster,
      })
      .orderBy('name')
      .asCallback(databaseTools.allExtractor(done))
  }
  
  /*
  
    get a single file for a single cluster

    params:

      * cluster
      * id or name
    
  */
  const get = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.clusterfile.get`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clusterfile.get`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name

    knex.select('*')
      .from('clusterfile')
      .where(queryParams)
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new clusterfile

    params:

      * data
        * cluster
        * name
        * base64data
      
      * transaction - used if present
    
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.clusterfile.create`)
    if(!params.data.cluster) return done(`data.cluster param must be given to store.clusterfile.create`)
    if(!params.data.name) return done(`data.name param must be given to store.clusterfile.create`)
    if(!params.data.base64data) return done(`data.base64data param must be given to store.clusterfile.create`)

    const insertData = {
      cluster: params.data.cluster,
      name: params.data.name,
      base64data: params.data.base64data,
    }

    const query = knex('clusterfile')
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }

    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a clusterfile

    params:

      * cluster
      * id or name
      * data
        * base64data
        
      * transaction - used if present
  
  */
  const update = (params, done) => {

    if(!params.cluster) return done(`cluster must be given to store.clusterfile.update`)
    if(!params.id && !params.name) return done(`id or name must be given to store.clusterfile.update`)
    if(!params.data) return done(`data param must be given to store.clusterfile.update`)
    if(!params.data.base64data) return done(`data.cluster param must be given to store.clusterfile.update`)

    const queryParams = {
      cluster: params.cluster,
    }

    if(params.id) queryParams.id = params.id
    if(params.name) queryParams.name = params.name

    const query = knex('clusterfile')
      .where(queryParams)
      .update({
        base64data: params.data.base64data,
      })
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
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
    
    const query = knex('clusterfile')
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

module.exports = ClusterFileStore