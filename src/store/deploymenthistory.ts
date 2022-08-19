import { Knex } from 'knex'
import Logging from '../logging'
import { Time } from './domain-types'
import { DeploymentHistoryEntity } from './entity-types'
import { DeploymentHistoryCreateRequest, DeploymentHistoryGetRequest, TimeRange } from './request-types'

const logger = Logging.getLogger({
  name: ' DeploymentHistoryStore',
})

export const TABLE = 'deployment_history'

const ORDER_BY_FIELDS = {
  field: 'recorded_at',
  direction: 'desc',
}

const DeploymentHistoryStore = (knex: Knex) => {
  const timeRange = (query: Knex.QueryBuilder, start: Time, end: Time) => {
    let retQuery = query
    if (start) {
      retQuery = query.andWhere('recorded_at', '>=', start)
    }
    if (end) {
      retQuery = query.andWhere('recorded_at', '<', end)
    }
    return retQuery
  }

  const list = ({ after, before }: TimeRange, trx: Knex.Transaction) => {
    let query = (trx || knex).select('*').from<DeploymentHistoryEntity>(TABLE)

    query = timeRange(query, after, before)
    return query
  }

  const get = ({ deployment_id, limit, after, before }: DeploymentHistoryGetRequest, trx: Knex.Transaction) => {
    if (!deployment_id) throw new Error('id must be given to store.deploymentresult.get')
    let query = (trx || knex).select('*').from<DeploymentHistoryEntity>(TABLE).where({ deployment_id })

    if (limit) {
      query = query.limit(limit)
    }

    query = query.orderBy(ORDER_BY_FIELDS.field, ORDER_BY_FIELDS.direction)

    query = timeRange(query, after, before)

    return query
  }

  const create = async (
    {
      data: { cluster_id, deployment_id, name, deployment_type, deployment_version, status, helm_response },
    }: DeploymentHistoryCreateRequest,
    trx: Knex.Transaction
  ) => {
    if (!name) throw new Error('data.name param must be given to store.deploymentresult.create')
    if (!status) throw new Error('data.status param must be given to store.deploymentresult.create')
    if (!deployment_id) throw new Error('data.deployment_id param must be given to store.deploymentresult.create')

    const [result] = await (trx || knex)<DeploymentHistoryEntity>(TABLE)
      .insert({
        cluster_id,
        deployment_id,
        name,
        deployment_type,
        deployment_version,
        status,
        helm_response,
      })
      .returning('*')
    logger.debug(
      {
        deployment_id: result.deployment_id,
        status: result.status,
      },
      `New result recorded for ${result.name}.`
    )

    return result
  }

  return {
    list,
    get,
    create,
  }
}

export default DeploymentHistoryStore
