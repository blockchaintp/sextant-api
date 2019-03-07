const databaseTools = require('../utils/database')
const enumerations = require('../enumerations')

const TaskStore = (knex) => {

  /*
  
    list all tasks

    we can filter tasks based on the following params:

     * cluster - list all tasks for a cluster
     * deployment - list all tasks for a deployment
     * user - list all tasks started by a user
     * status - list all tasks that have the given status
    
    all the above are optional - if nothing is defined we list all tasks across the system
  
  */
  const list = (params, done) => {

    const query = {}

    if(params.cluster) {
      query.resource_type = 'cluster'
      query.resource_id = params.cluster
    }

    if(params.deployment) {
      query.resource_type = 'deployment'
      query.resource_id = params.deployment
    }

    if(params.user) {
      query.user = params.user
    }

    if(params.status) {
      if(enumerations.TASK_STATUS.indexOf(params.status) < 0) return done(`bad task status: ${params.status}`)
      query.status = params.status
    }

    knex.select('*')
      .from('task')
      .where(query)
      .orderBy('created_at', 'desc')
      .asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    get a single task

    params:

      * id
    
  */
  const get = (params, done) => {
    if(!params.id) return done(`id must be given to store.task.get`)

    knex.select('*')
      .from('task')
      .where({
        id: params.id,
      })
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new task

    params:

      * data
        * user
        * resource_type
        * resource_id
        * restartable
        * payload
      
      * transaction - used if present
    
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.task.create`)
    if(!params.data.user) return done(`data.user param must be given to store.task.create`)
    if(!params.data.resource_type) return done(`data.resource_type param must be given to store.task.create`)
    if(!params.data.resource_id) return done(`data.resource_id param must be given to store.task.create`)
    if(typeof(params.data.restartable) !== 'boolean') return done(`data.restartable param must be given to store.task.create`)
    if(!params.data.payload) return done(`data.payload param must be given to store.task.create`)

    const insertData = {
      user: params.data.user,
      resource_type: params.data.resource_type,
      resource_id: params.data.resource_id,
      restartable: params.data.restartable,
      payload: params.data.payload,
      status: 'created',
    }

    const query = knex('task')
      .insert(insertData)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a task status

    params:

      * id
      * data (all optional)
        * status
      
      * transaction - used if present
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.task.update`)
    if(!params.data) return done(`data param must be given to store.task.update`)

    const query = knex('task')
      .where({
        id: params.id,
      })
      .update({
        status: params.data.status,
      })
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
  }
}

module.exports = TaskStore