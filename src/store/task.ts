/* eslint-disable no-shadow */
import { Knex } from 'knex'
import * as config from '../config'
import * as enumerations from '../enumerations'

export class TaskStore {
  private knex: Knex

  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    get active tasks for either a specific resource
    params:
     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment
  */
  public activeForResource(
    {
      cluster,
      deployment,
    }: {
      cluster?: number
      deployment?: number
    },
    trx: Knex.Transaction
  ) {
    if (!cluster && !deployment) throw new Error('cluster or deployment required for controller.task.activeForResource')

    const query: {
      cluster?: number
      deployment?: number
      status: string[]
    } = {
      // created tasks are expected to be picked up by the worker any moment
      // so count as active
      status: config.TASK_ACTIVE_STATUSES,
    }

    if (cluster) query.cluster = cluster
    if (deployment) query.deployment = deployment

    return this.list(query, trx)
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
        * status
  */
  public async create(
    { data: { user, resource_type, resource_id, action, restartable, payload, resource_status } },
    trx: Knex.Transaction
  ) {
    if (!user) throw new Error('data.user param must be given to store.task.create')
    if (!resource_type) throw new Error('data.resource_type param must be given to store.task.create')
    if (!resource_id) throw new Error('data.resource_id param must be given to store.task.create')
    if (!action) throw new Error('data.action param must be given to store.task.create')
    if (typeof restartable !== 'boolean') throw new Error('data.restartable param must be given to store.task.create')
    if (!payload) throw new Error('data.payload param must be given to store.task.create')

    const [result] = await (trx || this.knex)(config.TABLES.task)
      .insert({
        user,
        resource_type,
        resource_id,
        action,
        restartable,
        payload,
        resource_status,
      })
      .returning('*')
    return result
  }

  /*
    delete tasks for a resource
    params:
     * id
  */
  public deleteForResource({ resource_type, resource_id }, trx) {
    if (!resource_type) throw new Error('resource_type must be given to store.task.deleteForResource')
    if (!resource_id) throw new Error('resource_type must be given to store.task.deleteForResource')
    return (trx || this.knex)(config.TABLES.task)
      .where({
        resource_type,
        resource_id,
      })
      .del()
      .returning('*')
  }

  /*
    get a single task
    params:
      * id
  */
  public get({ id }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.task.get')

    return (trx || this.knex)
      .select('*')
      .from(config.TABLES.task)
      .where({
        id,
      })
      .first()
  }

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
  public list(
    {
      cluster,
      deployment,
      limit,
      user,
      status,
    }: {
      cluster?: number
      deployment?: number
      status?: string | string[]
      user?: number
      limit?: number
    },
    trx: Knex.Transaction
  ) {
    const query: {
      resource_type?: string
      resource_id?: number
      user?: number
    } = {}

    if (cluster) {
      query.resource_type = config.RESOURCE_TYPES.cluster
      query.resource_id = cluster
    }

    if (deployment) {
      query.resource_type = config.RESOURCE_TYPES.deployment
      query.resource_id = deployment
    }

    if (user) query.user = user

    let queryStatus = []

    if (status) {
      queryStatus = typeof status === 'string' ? [status] : status

      const badStatuses = queryStatus.filter((currentStatus) => enumerations.TASK_STATUS.indexOf(currentStatus) < 0)

      if (badStatuses.length > 0) {
        throw new Error(`bad task status: ${badStatuses.join(', ')}`)
      }
    }

    const orderBy = config.LIST_ORDER_BY_FIELDS.task

    const sqlQuery = (trx || this.knex).select('*').from(config.TABLES.task).orderBy(orderBy.field, orderBy.direction)

    if (Object.keys(query).length > 0 && queryStatus.length > 0) {
      sqlQuery.whereIn('status', queryStatus).andWhere(query)
    } else if (Object.keys(query).length > 0) {
      sqlQuery.where(query)
    } else if (queryStatus.length > 0) {
      sqlQuery.whereIn('status', queryStatus)
    }

    if (limit) {
      sqlQuery.limit(limit)
    }

    return sqlQuery
  }

  /*
    load the most recent task for a given resource
    params:
     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment
  */
  public mostRecentForResource({ cluster, deployment }, trx: Knex.Transaction) {
    if (!cluster && !deployment) throw new Error('cluster or deployment required for controller.task.activeForResource')

    const query: {
      cluster?: number
      deployment?: number
      limit: number
    } = {
      limit: 1,
    }

    if (cluster) query.cluster = cluster
    if (deployment) query.deployment = deployment

    return this.list(query, trx).first()
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
  public async update({ id, data: { status, error, started_at, ended_at } }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.task.update')
    if (!status) throw new Error('data.status param must be given to store.task.update')

    if (enumerations.TASK_STATUS.indexOf(status) < 0) throw new Error(`bad status: ${status}`)

    const updateData: {
      ended_at?: Date
      error?: any
      started_at?: Date
      status: string
    } = {
      status,
    }

    if (error) updateData.error = error
    if (started_at) updateData.started_at = started_at
    if (ended_at) updateData.ended_at = ended_at

    const [result] = await (trx || this.knex)(config.TABLES.task)
      .where({
        id,
      })
      .update(updateData)
      .returning('*')
    return result
  }
}
