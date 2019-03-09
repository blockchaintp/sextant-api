const config = require('../config')
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
      query.resource_type = config.RESOURCE_TYPES.cluster
      query.resource_id = params.cluster
    }

    if(params.deployment) {
      query.resource_type = config.RESOURCE_TYPES.deployment
      query.resource_id = params.deployment
    }

    if(params.user) {
      query.user = params.user
    }

    let status = []

    if(params.status) {
      status = typeof(params.status) === 'string' ? [params.status] : params.status

      const badStatuses = status.filter(status => enumerations.TASK_STATUS.indexOf(status) < 0)

      if(badStatuses.length > 0) {
        return done(`bad task status: ${badStatuses.join(', ')}`)
      }
    }

    const sqlQuery = knex.select('*')
      .from(config.TABLES.task)

    if(Object.keys(query).length > 0 && status.length > 0) {
      sqlQuery
        .whereIn('status', status)
        .andWhere(query)
    }
    else if(Object.keys(query).length > 0) {
      sqlQuery.where(query)
    }
    else if(status.length > 0) {
      sqlQuery
        .whereIn('status', status)
    }

    const orderBy = config.LIST_ORDER_BY_FIELDS.task

    sqlQuery
      .orderBy(orderBy.field, orderBy.direction)
      .asCallback(databaseTools.allExtractor(done))
  }


  /*
  
    get active tasks for either a specific resource

    params:

     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment

  */
  const activeForResource = (params, done) => {

    if(!params.cluster && !params.deployment) return done(`cluster or deployment required for controller.task.activeForResource`)

    const query = {
      // created tasks are expected to be picked up by the worker any moment
      // so count as active
      status: config.TASK_ACTIVE_STATUSES,
    }

    if(params.cluster) {
      query.cluster = params.cluster
    }

    if(params.deployment) {
      query.deployment = params.deployment
    }

    list(query, done)
  }


  /*
  
    get a single task

    params:

      * id
    
  */
  const get = (params, done) => {
    if(!params.id) return done(`id must be given to store.task.get`)

    knex.select('*')
      .from(config.TABLES.task)
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
        * action
        * restartable
        * payload
      
      * transaction - used if present
    
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.task.create`)
    if(!params.data.user) return done(`data.user param must be given to store.task.create`)
    if(!params.data.resource_type) return done(`data.resource_type param must be given to store.task.create`)
    if(!params.data.resource_id) return done(`data.resource_id param must be given to store.task.create`)
    if(!params.data.action) return done(`data.action param must be given to store.task.create`)
    if(typeof(params.data.restartable) !== 'boolean') return done(`data.restartable param must be given to store.task.create`)
    if(!params.data.payload) return done(`data.payload param must be given to store.task.create`)

    const insertData = {
      user: params.data.user,
      resource_type: params.data.resource_type,
      resource_id: params.data.resource_id,
      action: params.data.action,
      restartable: params.data.restartable,
      payload: params.data.payload,
      status: config.TASK_STATUS_DEFAULT,
    }

    const query = knex(config.TABLES.task)
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
      * data
        * status
      
      * transaction - used if present
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.task.update`)
    if(!params.data) return done(`data param must be given to store.task.update`)
    if(!params.data.status) return done(`data.status param must be given to store.task.update`)

    if(enumerations.TASK_STATUS.indexOf(params.data.status) < 0) return done(`bad status: ${params.data.status}`)

    const query = knex(config.TABLES.task)
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
    activeForResource,
    get,
    create,
    update,
  }
}

module.exports = TaskStore