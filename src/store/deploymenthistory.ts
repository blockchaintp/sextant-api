/* eslint-disable camelcase */
import { Knex } from 'knex'
import { getLogger } from '../logging'
import { DeploymentHistory } from './model/model-types'
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logger = getLogger({
  name: ' DeploymentHistoryStore',
})

export type DateRange = {
  after?: Date
  before?: Date
}

export class DeploymentHistoryStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  public async create(
    {
      data: { cluster_id, deployment_id, name, deployment_type, deployment_version, status, helm_response },
    }: {
      data: Pick<DeploymentHistory, 'deployment_id' | 'name' | 'status'> &
        Partial<Omit<DeploymentHistory, 'deployment_id' | 'name' | 'status'>>
    },
    trx?: Knex.Transaction
  ) {
    if (!name) throw new Error('data.name param must be given to store.deploymenthistory.create')
    if (!status) throw new Error('data.status param must be given to store.deploymenthistory.create')
    if (!deployment_id) throw new Error('data.deployment_id param must be given to store.deploymenthistory.create')

    const [result] = await (trx || this.knex)<DeploymentHistory>('deployment_history')
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    logger.debug(
      {
        deployment_id: result.deployment_id,
        status: result.status,
      },
      `New result recorded for ${result.name}.`
    )

    return result
  }

  public async getLast(
    { deployment_id, after, before }: { deployment_id: number } & DateRange,
    trx?: Knex.Transaction
  ) {
    if (!deployment_id) throw new Error('id must be given to store.deploymenthistory.get')
    let query = (trx || this.knex).select<DeploymentHistory>('*').from('deployment_history').where({ deployment_id })

    query = query.orderBy('recorded_at', 'desc')

    query = query.first<DeploymentHistory>()

    query = this.timeRange<DeploymentHistory>(query, after, before)
    return await query.returning<DeploymentHistory>('*')
  }

  public list({ after, before }: DateRange, trx?: Knex.Transaction) {
    let query = (trx || this.knex).select('*').from('deployment_history')

    query = this.timeRange(query, after, before)
    return query
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private timeRange<T>(query: Knex.QueryBuilder<{}, T>, start?: Date, end?: Date) {
    let retQuery = query
    if (start) {
      retQuery = query.andWhere('recorded_at', '>=', start)
    }
    if (end) {
      retQuery = query.andWhere('recorded_at', '<', end)
    }
    return retQuery
  }
}
