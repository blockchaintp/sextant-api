const config = require('../config')
const enumerations = require('../enumerations')

const TaskStore = (knex) => {

  /*
  
    list all tasks

    we can filter tasks based on the following params:

     * cluster - list all tasks for a cluster
     * deployment - list all tasks for a deployment
     * user - list all tasks started by a user
     * status - list all tasks that have the given status
     * limit - whether the limit the number of results
    
    all the above are optional - if nothing is defined we list all tasks across the system
  
  */
  const list = ({
    cluster,
    deployment,
    user,
    status,
    limit,
  }, trx) => {

    const query = {}

    if(cluster) {
      query.resource_type = config.RESOURCE_TYPES.cluster
      query.resource_id = cluster
    }

    if(deployment) {
      query.resource_type = config.RESOURCE_TYPES.deployment
      query.resource_id = deployment
    }

    if(user) query.user = user

    let queryStatus = []

    if(status) {
      queryStatus = typeof(status) === 'string' ? [status] : status

      const badStatuses = status.filter(status => enumerations.TASK_STATUS.indexOf(status) < 0)

      if(badStatuses.length > 0) {
        throw new Error(`bad task status: ${badStatuses.join(', ')}`)
      }
    }

    const orderBy = config.LIST_ORDER_BY_FIELDS.task

    const sqlQuery = (trx || knex).select('*')
      .from(config.TABLES.task)
      .orderBy(orderBy.field, orderBy.direction)

    if(Object.keys(query).length > 0 && queryStatus.length > 0) {
      sqlQuery
        .whereIn('status', queryStatus)
        .andWhere(query)
    }
    else if(Object.keys(query).length > 0) {
      sqlQuery.where(query)
    }
    else if(queryStatus.length > 0) {
      sqlQuery
        .whereIn('status', queryStatus)
    }

    if(limit) {
      sqlQuery.limit(limit)
    }

    return sqlQuery
  }


  /*
  
    get active tasks for either a specific resource

    params:

     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment

  */
  const activeForResource = ({
    cluster,
    deployment,
  }, trx) => {

    if(!cluster && !deployment) throw new Error(`cluster or deployment required for controller.task.activeForResource`)

    const query = {
      // created tasks are expected to be picked up by the worker any moment
      // so count as active
      status: config.TASK_ACTIVE_STATUSES,
    }

    if(cluster) query.cluster = cluster
    if(deployment) query.deployment = deployment

    return list(query, trx)
  }

  /*
  
    load the most recent task for a given resource

    params:

     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment

  */
  const mostRecentForResource = ({
    cluster,
    deployment,
  }, trx) => {
    if(!cluster && !deployment) throw new Error(`cluster or deployment required for controller.task.activeForResource`)

    const query = {}

    if(cluster) query.cluster = cluster
    if(deployment) query.deployment = deployment

    query.limit = 1
    query.transaction = params.transaction

    return list(query, trx).first()
  }


  /*
  
    get a single task

    params:

      * id

  */
  const get = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.task.get`)

    return (trx || knex).select('*')
      .from(config.TABLES.task)
      .where({
        id,
      })
      .first()
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
    
  */
  const create = ({
    data: {
      user,
      resource_type,
      resource_id,
      action,
      restartable,
      payload,
    }
  }, trx) => {
    if(!user) throw new Error(`data.user param must be given to store.task.create`)
    if(!resource_type) throw new Error(`data.resource_type param must be given to store.task.create`)
    if(!resource_id) throw new Error(`data.resource_id param must be given to store.task.create`)
    if(!action) throw new Error(`data.action param must be given to store.task.create`)
    if(typeof(restartable) !== 'boolean') throw new Error(`data.restartable param must be given to store.task.create`)
    if(!payload) throw new Error(`data.payload param must be given to store.task.create`)

    return (trx || knex)(config.TABLES.task)
      .insert({
        user,
        resource_type,
        resource_id,
        action,
        restartable,
        payload,
        status,
      })
      .returning('*')
      .get(0)
  }

  /*
  
    update a task status

    params:

      * id
      * data
        * status
        * error
        * started_at
        * ended_at
  
  */
  const update = ({
    id,
    data: {
      status,
      error,
      started_at,
      ended_at
    }
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.task.update`)
    if(!status) throw new Error(`data.status param must be given to store.task.update`)

    if(enumerations.TASK_STATUS.indexOf(status) < 0) throw new Error(`bad status: ${params.data.status}`)

    const updateData = {
      status,
    }

    if(error) updateData.error = error
    if(started_at) updateData.started_at = started_at
    if(ended_at) updateData.ended_at = ended_at

    return (trx || knex)(config.TABLES.task)
      .where({
        id: params.id,
      })
      .update(updateData)
      .returning('*')
      .get(0)
  }

  return {
    list,
    activeForResource,
    mostRecentForResource,
    get,
    create,
    update,
  }
}

module.exports = TaskStore