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

      * user
      * resource_type
      * resource_id
      * restartable
      * payload
    
  */
  const create = (params, done) => {
    if(!params.user) return done(`user param must be given to store.task.create`)
    if(!params.resource_type) return done(`resource_type param must be given to store.task.create`)
    if(!params.resource_id) return done(`resource_id param must be given to store.task.create`)
    if(typeof(params.restartable) !== 'boolean') return done(`restartable param must be given to store.task.create`)
    if(!params.payload) return done(`payload param must be given to store.task.create`)

    const insertData = {
      user: params.user,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      restartable: params.restartable,
      payload: params.payload,
      status: 'created',
    }

    knex('task')
      .insert(insertData)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a task status

    params:

      * id
      * data (all optional)
        * status
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.task.update`)
    if(!params.data) return done(`data param must be given to store.task.update`)

    knex('task')
      .where({
        id: params.id,
      })
      .update({
        status: params.data.status,
      })
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  return {
    list,
    get,
    create,
    update,
  }
}

module.exports = TaskStore