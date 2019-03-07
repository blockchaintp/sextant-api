const databaseTools = require('../utils/database')

const ClusterStore = (knex) => {

  /*
  
    list all clusters
  
  */
  const list = (params, done) => {
    knex.select('*')
      .from('cluster')
      .orderBy('name')
      .asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    get a single cluster

    params:

      * id
    
  */
  const get = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.get`)

    knex.select('*')
      .from('cluster')
      .where({
        id: params.id,
      })
      .asCallback(databaseTools.singleExtractor(done))
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

    const query = knex('cluster')
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }

    query.asCallback(databaseTools.singleExtractor(done))
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
    if(!params.id) return done(`id must be given to store.cluster.update`)
    if(!params.data) return done(`data param must be given to store.cluster.update`)

    const query = knex('cluster')
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
  
    delete a single cluster

    params:

      * id

      * transaction - used if present
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.delete`)
    
    const query = knex('cluster')
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

module.exports = ClusterStore