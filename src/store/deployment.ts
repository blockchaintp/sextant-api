/* eslint-disable camelcase */
import { Knex } from 'knex'
import { CLUSTER_STATUS, LIST_ORDER_BY_FIELDS, TABLES } from '../config'
import { DeploymentHistoryStore } from './deploymenthistory'
import { Deployment, DeploymentHistory } from './model/model-types'
import { DatabaseIdentifier } from './model/scalar-types'

const currentHour = () => {
  const now = new Date()
  now.setMilliseconds(0)
  now.setSeconds(0)
  now.setMinutes(0)
  return now
}

export type DeploymentIdentifying = { id: DatabaseIdentifier }

export class DeploymentStore {
  private deploymentHistoryStore: DeploymentHistoryStore
  private knex: Knex

  constructor(knex: Knex) {
    this.knex = knex
    this.deploymentHistoryStore = new DeploymentHistoryStore(this.knex)
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
  public async create(
    {
      data: { cluster, name, deployment_type, deployment_version, desired_state, custom_yaml, deployment_method },
    }: {
      data: Pick<Deployment, 'cluster' | 'deployment_type' | 'name' | 'deployment_version' | 'desired_state'> &
        Partial<Pick<Deployment, 'custom_yaml' | 'deployment_method'>>
    },
    trx?: Knex.Transaction
  ) {
    if (!cluster) throw new Error('data.cluster param must be given to store.deployment.create')
    if (!name) throw new Error('data.name param must be given to store.deployment.create')
    if (!deployment_type) throw new Error('data.deployment_type param must be given to store.deployment.create')
    if (!deployment_version) throw new Error('data.deployment_version param must be given to store.deployment.create')
    if (!desired_state) throw new Error('data.desired_state param must be given to store.deployment.create')

    const [result] = await (trx || this.knex)<Deployment>(TABLES.deployment)
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

    await this.deploymentHistoryStore.create(
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
    delete a single deployment
    params:
      * id
  */
  public async delete({ id }: DeploymentIdentifying, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.deployment.delete')
    const deployment = await this.get({ id }, trx)

    const [result] = await (trx || this.knex)<Deployment>(TABLES.deployment)
      .where({
        id,
      })
      .del()
      .returning('*')

    const deleteStatus = deployment.status === 'deleted' ? 'erased' : 'deleted'
    await this.deploymentHistoryStore.create(
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

  /*
    get a single deployment
    params:
      * id
  */
  public get({ id }: DeploymentIdentifying, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.deployment.get')

    return (trx || this.knex)
      .select<Deployment>('*')
      .from(TABLES.deployment)
      .where({
        id,
      })
      .first<Deployment>()
  }

  /*
    list all deployments for a cluster
    params:
      * cluster
  */
  public list({ cluster, deleted }: { cluster: number | 'all'; deleted: boolean }, trx?: Knex.Transaction) {
    const orderBy = LIST_ORDER_BY_FIELDS.clusterfile

    if (!cluster) throw new Error('cluster must be given to store.deployment.list')

    const sqlQuery = (trx || this.knex)<Deployment>(TABLES.deployment)
    if (cluster !== 'all') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sqlQuery.where({
        cluster,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    sqlQuery.orderBy(orderBy.field, orderBy.direction)

    if (!deleted) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sqlQuery.andWhereNot({
        status: CLUSTER_STATUS.deleted,
      })
    }

    return sqlQuery
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
  public async update({ id, data }: { data: Partial<Deployment>; id: number }, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')
    const previousRecord = await this.deploymentHistoryStore.getLast({ deployment_id: id }, trx)
    const [result] = await (trx || this.knex)<Deployment>(TABLES.deployment)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    if (previousRecord && previousRecord.status !== result.status) {
      await this.deploymentHistoryStore.create(
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

  public async updateStatus(
    {
      id,
      helm_response,
      data,
    }: DeploymentIdentifying & { data: Partial<Deployment> } & Partial<Pick<DeploymentHistory, 'helm_response'>>,
    trx?: Knex.Transaction
  ) {
    if (!id) throw new Error('id must be given to store.cluster.update')
    if (!data) throw new Error('data param must be given to store.cluster.update')
    const ts = new Date(currentHour()).getTime()
    let deploymentsToUpdate = await (trx || this.knex)<Deployment>(TABLES.deployment).where({
      id,
    })
    deploymentsToUpdate = deploymentsToUpdate
      .filter((deployment) => deployment.status === data.status)
      .filter((deployment) => {
        if (data.updated_at) {
          if (new Date(deployment.updated_at).getTime() < new Date(data.updated_at).getTime()) {
            return true
          }
        }
        if (new Date(deployment.updated_at).getTime() < ts) {
          return true
        }
      })
    const [result] = await Promise.all(
      deploymentsToUpdate.map((deployment) => {
        return (trx || this.knex)<Deployment>(TABLES.deployment)
          .where({
            id: deployment.id,
          })
          .update(data)
          .returning<Deployment>('*')
      })
    )
    if (result) {
      await this.deploymentHistoryStore.create(
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
}
