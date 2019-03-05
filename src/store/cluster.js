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

      * name
      * provision_type
      * capabilities
      * desired_state
    
  */
  const create = (params, done) => {
    if(!params.name) return done(`name param must be given to store.cluster.create`)
    if(!params.provision_type) return done(`provision_type param must be given to store.cluster.create`)
    if(!params.desired_state) return done(`desired_state param must be given to store.cluster.create`)

    const insertData = {
      name: params.name,
      provision_type: params.provision_type,
      capabilities: params.capabilities,
      desired_state: params.desired_state,
    }

    knex('cluster')
      .insert(insertData)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
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
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.update`)
    if(!params.data) return done(`data param must be given to store.cluster.update`)

    knex('cluster')
      .where({
        id: params.id,
      })
      .update(params.data)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single cluster

    params:

      * id
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.delete`)
    
    knex('cluster')
      .where({
        id: params.id,
      })
      .del()
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
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