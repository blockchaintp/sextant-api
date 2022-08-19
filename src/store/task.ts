/* eslint-disable no-shadow */
import { Knex } from 'knex'
import { RESOURCE_TYPES, TASK_ACTIVE_STATUSES } from '../config'
import { TASK_STATUS } from '../enumerations'
import { DatabaseIdentifier, TaskStatus, Time } from './domain-types'
import { TaskEntity } from './entity-types'
import {
  TaskCreateRequest,
  TaskDeleteForResourceRequest,
  TaskGetRequest,
  TaskListActiveForResourceRequest,
  TaskListRecentForResourceRequest,
  TaskListRequest,
  TaskUpdateRequest,
} from './request-types'

export const TABLE = 'task'

const ORDER_BY_FIELDS = {
  field: 'created_at',
  direction: 'desc',
}

const TaskStore = (knex: Knex) => {
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
  const list = ({ cluster, deployment, user, status, limit }: TaskListRequest, trx: Knex.Transaction) => {
    const query: {
      resource_type?: string
      resource_id?: DatabaseIdentifier
      user?: DatabaseIdentifier
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

    let queryStatus: TaskStatus[] | string[] = []

    if (status) {
      queryStatus = typeof status === 'string' ? [status] : status

      const badStatuses = queryStatus.filter((currentStatus) => TASK_STATUS.indexOf(currentStatus) < 0)

      if (badStatuses.length > 0) {
        throw new Error(`bad task status: ${badStatuses.join(', ')}`)
      }
    }

    const orderBy = ORDER_BY_FIELDS

    const sqlQuery = (trx || knex).select('*').from<TaskEntity>(TABLE).orderBy(orderBy.field, orderBy.direction)

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

    get active tasks for either a specific resource

    params:

     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment

  */
  const activeForResource = ({ cluster, deployment }: TaskListActiveForResourceRequest, trx: Knex.Transaction) => {
    if (!cluster && !deployment) throw new Error('cluster or deployment required for controller.task.activeForResource')

    const query: {
      cluster?: DatabaseIdentifier
      deployment?: DatabaseIdentifier
      status: string[]
    } = {
      // created tasks are expected to be picked up by the worker any moment
      // so count as active
      status: TASK_ACTIVE_STATUSES,
    }

    if (cluster) query.cluster = cluster
    if (deployment) query.deployment = deployment

    return list(query, trx)
  }

  /*

    load the most recent task for a given resource

    params:

     * cluster - we want active tasks for a cluster
     * deployment - we want active tasks for a deployment

  */
  const mostRecentForResource = ({ cluster, deployment }: TaskListRecentForResourceRequest, trx: Knex.Transaction) => {
    if (!cluster && !deployment) throw new Error('cluster or deployment required for controller.task.activeForResource')

    const query: {
      cluster?: DatabaseIdentifier
      deployment?: DatabaseIdentifier
      limit: number
    } = {
      limit: 1,
    }

    if (cluster) query.cluster = cluster
    if (deployment) query.deployment = deployment

    return list(query, trx).first()
  }

  /*

    get a single task

    params:

      * id

  */
  const get = ({ id }: TaskGetRequest, trx: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.task.get')

    return (trx || knex)
      .select('*')
      .from<TaskEntity>(TABLE)
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
        * status

  */
  const create = async (
    { data: { user, resource_type, resource_id, action, restartable, payload, resource_status } }: TaskCreateRequest,
    trx: Knex.Transaction
  ) => {
    if (!user) throw new Error('data.user param must be given to store.task.create')
    if (!resource_type) throw new Error('data.resource_type param must be given to store.task.create')
    if (!resource_id) throw new Error('data.resource_id param must be given to store.task.create')
    if (!action) throw new Error('data.action param must be given to store.task.create')
    if (typeof restartable !== 'boolean') throw new Error('data.restartable param must be given to store.task.create')
    if (!payload) throw new Error('data.payload param must be given to store.task.create')

    const [result] = await (trx || knex)<TaskEntity>(TABLE)
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

    update a task status

    params:

      * id
      * data
        * status
        * error
        * started_at
        * ended_at

  */
  const update = async (
    { id, data: { status, error, started_at, ended_at } }: TaskUpdateRequest,
    trx: Knex.Transaction
  ) => {
    if (!id) throw new Error('id must be given to store.task.update')
    if (!status) throw new Error('data.status param must be given to store.task.update')

    if (TASK_STATUS.indexOf(status) < 0) throw new Error(`bad status: ${status}`)

    const updateData: {
      status: TaskStatus
      error?: string
      started_at?: Time
      ended_at?: Time
    } = {
      status,
    }

    if (error) updateData.error = error
    if (started_at) updateData.started_at = started_at
    if (ended_at) updateData.ended_at = ended_at

    const [result] = await (trx || knex)<TaskEntity>(TABLE)
      .where({
        id,
      })
      .update(updateData)
      .returning('*')
    return result
  }

  /*

    delete tasks for a resource

    params:

     * id

  */
  const deleteForResource = ({ resource_type, resource_id }: TaskDeleteForResourceRequest, trx: Knex.Transaction) => {
    if (!resource_type) throw new Error('resource_type must be given to store.task.deleteForResource')
    if (!resource_id) throw new Error('resource_type must be given to store.task.deleteForResource')
    return (trx || knex)<TaskEntity>(TABLE)
      .where({
        resource_type,
        resource_id,
      })
      .del()
      .returning('*')
  }

  return {
    list,
    activeForResource,
    mostRecentForResource,
    get,
    create,
    update,
    deleteForResource,
  }
}

export default TaskStore
