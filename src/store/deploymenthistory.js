const logger = require('../logging').getLogger({
  name: ' DeploymentHistoryStore',
})

const DeploymentHistoryStore = (knex) => {
  const list = (trx) => (trx || knex).select('*')
    .from('deployment_history')

  const get = ({
    deployment_id,
    limit,
    first,
    after,
    before,
  }, trx) => {
    if (!deployment_id) throw new Error('id must be given to store.deploymentresult.get')
    let query = (trx || knex).select('*')
      .from('deployment_history')
      .where({ deployment_id })

    if (limit) {
      query = query.limit(limit)
    }

    query = query.orderBy('recorded_at', 'desc')

    if (first) {
      query = query.first()
    }
    if (after) {
      query = query.andWhere('recorded_at', '>=', after)
    }
    if (before) {
      query = query.andWhere('recorded_at', '<', before)
    }

    return query
  }

  const create = async ({
    data: {
      cluster_id,
      deployment_id,
      name,
      deployment_type,
      deployment_version,
      status,
      helm_response,
    },
  }, trx) => {
    if (!name) throw new Error('data.name param must be given to store.deploymentresult.create')
    if (!status) throw new Error('data.status param must be given to store.deploymentresult.create')
    if (!deployment_id) throw new Error('data.deployment_id param must be given to store.deploymentresult.create')

    const [result] = await (trx || knex)('deployment_history')
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
    logger.debug({
      deployment_id: result.deployment_id,
      status: result.status,
    }, `New result recorded for ${result.name}.`)

    return result
  }

  return {
    list,
    get,
    create,
  }
}

module.exports = DeploymentHistoryStore
