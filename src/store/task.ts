/* eslint-disable camelcase */
/* eslint-disable no-shadow */
import { Knex } from 'knex'
import { LIST_ORDER_BY_FIELDS, RESOURCE_TYPES, TABLES, TASK_ACTIVE_STATUSES } from '../config'
import { TASK_STATUS } from '../enumerations'
import { ResourceInfo, Task } from './model/model-types'
import { DatabaseIdentifier } from './model/scalar-types'

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
    trx?: Knex.Transaction
  ) {
    if (!cluster && !deployment) throw new Error('cluster or deployment required for controller.task.activeForResource')

    const query: {
      cluster?: number
      deployment?: number
      status: string[]
    } = {
      // created tasks are expected to be picked up by the worker any moment
      // so count as active
      status: TASK_ACTIVE_STATUSES,
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
    {
      data: { user, resource_type, resource_id, action, restartable, payload, resource_status },
    }: {
      data: Pick<Task, 'user' | 'resource_type' | 'resource_id' | 'payload' | 'restartable' | 'action'> &
        Partial<Pick<Task, 'resource_status'>>
    },
    trx?: Knex.Transaction
  ) {
    if (!user) throw new Error('data.user param must be given to store.task.create')
    if (!resource_type) throw new Error('data.resource_type param must be given to store.task.create')
    if (!resource_id) throw new Error('data.resource_id param must be given to store.task.create')
    if (!action) throw new Error('data.action param must be given to store.task.create')
    if (typeof restartable !== 'boolean') throw new Error('data.restartable param must be given to store.task.create')
    if (!payload) throw new Error('data.payload param must be given to store.task.create')

    const [result] = await (trx || this.knex)<Task>(TABLES.task)
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
  public deleteForResource({ resource_type, resource_id }: ResourceInfo, trx?: Knex.Transaction) {
    if (!resource_type) throw new Error('resource_type must be given to store.task.deleteForResource')
    if (!resource_id) throw new Error('resource_type must be given to store.task.deleteForResource')
    return (trx || this.knex)<Task>(TABLES.task)
      .where({
        resource_type,
        resource_id,
      })
      .del()
      .returning<Task>('*')
  }

  /*
    get a single task
    params:
      * id
  */
  public get({ id }: { id: DatabaseIdentifier }, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.task.get')

    return (trx || this.knex)
      .select<Task>('*')
      .from(TABLES.task)
      .where({
        id,
      })
      .first<Task>()
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
      cluster?: DatabaseIdentifier
      deployment?: DatabaseIdentifier
      limit?: number
      status?: string | string[]
      user?: DatabaseIdentifier
    },
    trx?: Knex.Transaction
  ) {
    const query: {
      resource_id?: number
      resource_type?: string
      user?: number
    } = {}

    if (cluster) {
      query.resource_type = RESOURCE_TYPES.cluster
      query.resource_id = cluster
    }

    if (deployment) {
      query.resource_type = RESOURCE_TYPES.deployment
      query.resource_id = deployment
    }

    if (user) query.user = user

    let queryStatus: string[] = []

    if (status) {
      queryStatus = typeof status === 'string' ? [status] : status

      const badStatuses = queryStatus.filter((currentStatus) => TASK_STATUS.indexOf(currentStatus) < 0)

      if (badStatuses.length > 0) {
        throw new Error(`bad task status: ${badStatuses.join(', ')}`)
      }
    }

    const orderBy = LIST_ORDER_BY_FIELDS.task

    let sqlQuery = (trx || this.knex).select<Task>('*').from(TABLES.task).orderBy(orderBy.field, orderBy.direction)

    if (Object.keys(query).length > 0 && queryStatus.length > 0) {
      sqlQuery = sqlQuery.whereIn('status', queryStatus).andWhere(query)
    } else if (Object.keys(query).length > 0) {
      sqlQuery = sqlQuery.where(query)
    } else if (queryStatus.length > 0) {
      sqlQuery = sqlQuery.whereIn('status', queryStatus)
    }

    if (limit) {
      sqlQuery = sqlQuery.limit(limit)
    }

    return sqlQuery.returning<Task[]>('*')
  }

  /*
    load the most recent task for a given resource
    params:
     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment
  */
  public mostRecentForResource(
    {
      cluster,
      deployment,
    }: {
      cluster?: DatabaseIdentifier
      deployment?: DatabaseIdentifier
    },
    trx?: Knex.Transaction
  ) {
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

    return this.list(query, trx).first<Task>()
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
  public async update(
    {
      id,
      data: { status, error, started_at, ended_at },
    }: {
      data: Pick<Task, 'ended_at' | 'error' | 'started_at' | 'status'>
      id: DatabaseIdentifier
    },
    trx?: Knex.Transaction
  ) {
    if (!id) throw new Error('id must be given to store.task.update')
    if (!status) throw new Error('data.status param must be given to store.task.update')

    if (TASK_STATUS.indexOf(status) < 0) throw new Error(`bad status: ${status}`)

    const updateData: {
      ended_at?: Date
      error?: string
      started_at?: Date
      status: string
    } = {
      status,
    }

    if (error) updateData.error = error
    if (started_at) updateData.started_at = started_at
    if (ended_at) updateData.ended_at = ended_at

    const [result] = await (trx || this.knex)<Task>(TABLES.task)
      .where({
        id,
      })
      .update(updateData)
      .returning('*')
    return result
  }
}
