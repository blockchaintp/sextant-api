import { Knex } from 'knex'
import { CLUSTER_STATUS } from '../config'
import DeploymentHistoryStore from './deploymenthistory'

import { DeploymentEntity } from './entity-types'
import {
  DeploymentCreateRequest,
  DeploymentDeleteRequest,
  DeploymentGetRequest,
  DeploymentListRequest,
  DeploymentUpdateRequest,
  DeploymentUpdateStatusRequest,
} from './request-types'

const currentHour = () => {
  const now = new Date()
  now.setMilliseconds(0)
  now.setSeconds(0)
  now.setMinutes(0)
  return now
}

export const TABLE = 'deployment'

const ORDER_BY_FIELDS = {
  field: 'name',
  direction: 'asc',
}

const DeploymentStore = (knex: Knex) => {
  const deploymentHistoryStore = DeploymentHistoryStore(knex)
  /*

    list all deployments for a cluster

    params:

      * cluster

  */
  const list = ({ cluster, deleted }: DeploymentListRequest, trx?: Knex.Transaction) => {
    const orderBy = ORDER_BY_FIELDS

    if (!cluster) throw new Error('cluster must be given to store.deployment.list')

    const sqlQuery = (trx || knex).select('*').from<DeploymentEntity>(TABLE)

    if (cluster !== 'all') {
      sqlQuery.where({
        cluster,
      })
    }

    sqlQuery.orderBy(orderBy.field, orderBy.direction)

    if (!deleted) {
      sqlQuery.andWhereNot({
        status: CLUSTER_STATUS.deleted,
      })
    }

    return sqlQuery
  }

  /*

    get a single deployment

    params:

      * id

  */
  const get = ({ id }: DeploymentGetRequest, trx?: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.deployment.get')

    return (trx || knex)
      .select('*')
      .from<DeploymentEntity>(TABLE)
      .where({
        id,
      })
      .first()
  }

  /*

    insert a new deployment

    params:

      * data
        * cluster
        * deployment_type
        * name
        * desired_state

    status is set to 'created' for a new deployment

  */
  const create = async (
    {
      data: { cluster, name, deployment_type, deployment_version, desired_state, custom_yaml, deployment_method },
    }: DeploymentCreateRequest,
    trx?: Knex.Transaction
  ) => {
    if (!cluster) throw new Error('data.cluster param must be given to store.deployment.create')
    if (!name) throw new Error('data.name param must be given to store.deployment.create')
    if (!deployment_type) throw new Error('data.deployment_type param must be given to store.deployment.create')
    if (!deployment_version) throw new Error('data.deployment_version param must be given to store.deployment.create')
    if (!desired_state) throw new Error('data.desired_state param must be given to store.deployment.create')

    const [result] = await (trx || knex)<DeploymentEntity>(TABLE)
      .insert({
        cluster,
        name,
        deployment_type,
        deployment_version,
        desired_state,
        custom_yaml,
        deployment_method,
      })
      .returning('*')

    await deploymentHistoryStore.create(
      {
        data: {
          cluster_id: cluster,
          name,
          deployment_id: result.id,
          deployment_type,
          deployment_version,
          status: result.status,
          helm_response: {},
        },
      },
      trx
    )

    return result
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
  const update = async ({ id, data }: DeploymentUpdateRequest, trx?: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')
    const [previousRecord] = await deploymentHistoryStore.get(
      {
        deployment_id: id,
        limit: 1,
        after: new Date(0),
        before: new Date(),
      },
      trx
    )
    const [result] = await (trx || knex)<DeploymentEntity>(TABLE)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    if (previousRecord && previousRecord.status !== result.status) {
      await deploymentHistoryStore.create(
        {
          data: {
            cluster_id: result.cluster,
            deployment_id: id,
            name: result.name,
            deployment_type: result.deployment_type,
            deployment_version: result.deployment_version,
            status: result.status,
            helm_response: {},
          },
        },
        trx
      )
    }
    return result
  }

  /*

    delete a single deployment

    params:

      * id

  */
  const del = async ({ id }: DeploymentDeleteRequest, trx?: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.deployment.delete')

    const [result] = await (trx || knex)<DeploymentEntity>(TABLE)
      .where({
        id,
      })
      .del()
      .returning('*')

    const deleteStatus = result.status === 'deleted' ? 'erased' : 'deleted'
    await deploymentHistoryStore.create(
      {
        data: {
          cluster_id: result.cluster,
          deployment_id: id,
          name: result.name,
          deployment_type: result.deployment_type,
          deployment_version: result.deployment_version,
          status: deleteStatus,
          helm_response: {},
        },
      },
      trx
    )

    return result
  }

  const updateStatus = async ({ id, helm_response, data }: DeploymentUpdateStatusRequest, trx?: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')
    const ts = new Date(currentHour()).toISOString().replace('T', ' ').replace('Z', '')
    const [result] = await (trx || knex)<DeploymentEntity>(TABLE)
      .where({
        id,
      })
      .andWhere((a) => {
        a.orWhere((b) => {
          b.where('updated_at', '<', data.updated_at).andWhereNot('status', '=', `${data.status}`)
        }).orWhere((c) => {
          c.whereRaw(`updated_at < '${ts}'::timestamp`).andWhere('status', '=', `${data.status}`)
        })
      })
      .update(data)
      .returning('*')
    if (result) {
      await deploymentHistoryStore.create(
        {
          data: {
            cluster_id: result.cluster,
            deployment_id: id,
            name: result.name,
            deployment_type: result.deployment_type,
            deployment_version: result.deployment_version,
            status: result.status,
            helm_response,
          },
        },
        trx
      )
    }
    return result
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    updateStatus,
  }
}

export default DeploymentStore
