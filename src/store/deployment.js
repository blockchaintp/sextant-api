const databaseTools = require('../utils/database')

const DeploymentStore = (knex) => {

  /*
  
    list all deployments for a cluster

    params:

      * cluster
  
  */
  const list = (params, done) => {
    if(!params.cluster) return done(`cluster must be given to store.deployment.list`)
    
    knex.select('*')
      .from('deployment')
      .where({
        cluster: params.cluster,
      })
      .orderBy('name')
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
      .from('deployment')
      .where({
        id: params.id,
      })
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new deployment

    params:

      * cluster
      * name
      * desired_state
    
    status is set to 'created' for a new deployment

  */
  const create = (params, done) => {
    if(!params.cluster) return done(`cluster param must be given to store.deployment.create`)
    if(!params.name) return done(`name param must be given to store.deployment.create`)
    if(!params.desired_state) return done(`desired_state param must be given to store.deployment.create`)

    const insertData = {
      cluster: params.cluster,
      name: params.name,
      desired_state: params.desired_state,
      status: 'created',
    }

    knex('deployment')
      .insert(insertData)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
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
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.cluster.update`)
    if(!params.data) return done(`data param must be given to store.cluster.update`)

    knex('deployment')
      .where({
        id: params.id,
      })
      .update(params.data)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single deployment

    params:

      * id
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.deployment.delete`)

    knex('deployment')
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

module.exports = DeploymentStore