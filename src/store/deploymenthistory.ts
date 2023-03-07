import { Knex } from 'knex'
import { getLogger } from '../logging'
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
    { data: { cluster_id, deployment_id, name, deployment_type, deployment_version, status, helm_response } },
    trx: Knex.Transaction
  ) {
    if (!name) throw new Error('data.name param must be given to store.deploymentresult.create')
    if (!status) throw new Error('data.status param must be given to store.deploymentresult.create')
    if (!deployment_id) throw new Error('data.deployment_id param must be given to store.deploymentresult.create')

    const [result] = await (trx || this.knex)('deployment_history')
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

  public get(
    {
      deployment_id,
      limit,
      first,
      after,
      before,
    }: { deployment_id: number; limit?: number; first?: boolean } & DateRange,
    trx: Knex.Transaction
  ): any {
    if (!deployment_id) throw new Error('id must be given to store.deploymentresult.get')
    let query = (trx || this.knex).select('*').from('deployment_history').where({ deployment_id })

    if (limit) {
      query = query.limit(limit)
    }

    query = query.orderBy('recorded_at', 'desc')

    if (first) {
      query = query.first()
    }

    query = this.timeRange(query, after, before)
    return query
  }

  public list({ after, before }: DateRange, trx: Knex.Transaction) {
    let query = (trx || this.knex).select('*').from('deployment_history')

    query = this.timeRange(query, after, before)
    return query
  }

  private timeRange(query, start?: Date, end?: Date) {
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
