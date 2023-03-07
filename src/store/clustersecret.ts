import { Knex } from 'knex'
import * as config from '../config'
import * as base64 from '../utils/base64'

/*
  NOTE - this could be replaced with something like Hashicorp vault
  at some point
*/

export class ClusterSecretStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new clustersecret
    params:
      * data
        * cluster
        * name
        * rawData || base64Data
  */
  public async create({ data: { cluster, name, rawData, base64Data } }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`data.cluster param must be given to store.clustersecret.create`)
    if (!name) throw new Error(`data.name param must be given to store.clustersecret.create`)
    if (!rawData && !base64Data)
      throw new Error(`data.rawData or data.base64Data param must be given to store.clustersecret.create`)

    const insertData = {
      cluster,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    const [result] = await (trx || this.knex)(config.TABLES.clustersecret).insert(insertData).returning('*')
    return result
  }

  /*
    delete a single clustersecret
    params:
      * cluster
      * id or name
  */
  public async delete({ cluster, id, name }: { cluster: number; id?: number; name?: string }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.del`)
    if (!id && !name) throw new Error(`id or name must be given to store.clustersecret.del`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(config.TABLES.clustersecret).where(queryParams).del().returning('*')
    return result
  }

  /*
    delete all secrets for a cluster
    params:
      * cluster
  */
  public async deleteForCluster({ cluster }: { cluster: number }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.deleteForCluster`)
    const [result] = await (trx || this.knex)(config.TABLES.clustersecret)
      .where({
        cluster,
      })
      .del()
      .returning('*')
    return result
  }

  /*
    get a single secret for a single cluster
    params:
      * cluster
      * id or name
  */
  public get({ cluster, id, name }: { cluster: number; id?: number; name?: string }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.clustersecret.get`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || this.knex).select('*').from(config.TABLES.clustersecret).where(queryParams).first()
  }

  /*
    list all secrets for a single cluster
    params:
      * cluster
  */
  public list({ cluster }: { cluster: number }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.clustersecret

    return (trx || this.knex)
      .select('*')
      .from(config.TABLES.clustersecret)
      .where({
        cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*
    replace a single clustersecret
    i.e. one of create or update
    params:
      * data
        * cluster
        * name
        * rawData || base64Data
  */
  public async replace({ data: { cluster, name, rawData, base64Data } }, trx: Knex.Transaction) {
    await this.delete(
      {
        cluster,
        name,
      },
      trx
    )

    return this.create(
      {
        data: {
          cluster,
          name,
          rawData,
          base64Data,
        },
      },
      trx
    )
  }
  /*
    update a clustersecret
    params:
      * cluster
      * id or name
      * data
        * rawData || base64Data
  */
  public async update({ cluster, id, name, data: { rawData, base64Data } }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.update`)
    if (!id && !name) throw new Error(`id or name must be given to store.clustersecret.update`)
    if (!rawData && !base64Data)
      throw new Error(`data.rawData or data.base64Data param must be given to store.clustersecret.update`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(config.TABLES.clustersecret)
      .where(queryParams)
      .update({
        base64data: base64Data || base64.encode(rawData),
      })
      .returning('*')
    return result
  }
}
