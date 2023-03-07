import { Knex } from 'knex'
import * as config from '../config'
import * as base64 from '../utils/base64'

export class ClusterFileStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new clusterfile
    params:
      * data
        * cluster
        * name
        * rawData
        * base64Data
  */
  public async create({ data: { cluster, name, rawData, base64Data } }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`data.cluster param must be given to store.clusterfile.create`)
    if (!name) throw new Error(`data.name param must be given to store.clusterfile.create`)
    if (!rawData && !base64Data)
      throw new Error(`data.rawData or data.base64Data param must be given to store.clusterfile.create`)

    const insertData = {
      cluster,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    const [result] = await (trx || this.knex)(config.TABLES.clusterfile).insert(insertData).returning('*')
    return result
  }

  /*
    delete a single clusterfile
    params:
      * cluster
      * id or name
  */
  public async delete({ cluster, id, name }: { cluster: number; id?: number; name?: string }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.clusterfile.get`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(config.TABLES.clusterfile).where(queryParams).del().returning('*')
    return result
  }

  /*
    delete all files for a cluster
    params:
      * cluster
  */
  public async deleteForCluster({ cluster }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.del`)
    const [result] = await (trx || this.knex)(config.TABLES.clusterfile)
      .where({
        cluster,
      })
      .del()
      .returning('*')
    return result
  }

  /*
    get a single file for a single cluster
    params:
      * cluster
      * id or name
  */
  public get({ cluster, id, name }: { cluster: number; id?: number; name?: string }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.clusterfile.get`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || this.knex).select('*').from(config.TABLES.clusterfile).where(queryParams).first()
  }

  /*
    list all files for a single cluster
    params:
      * cluster
  */
  public list({ cluster }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.clusterfile

    return (trx || this.knex)
      .select('*')
      .from(config.TABLES.clusterfile)
      .where({
        cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*
    update a clusterfile
    params:
      * cluster
      * id or name
      * data
        * rawData
  */
  public async update(
    {
      cluster,
      id,
      name,
      data: { rawData, base64Data },
    }: { cluster: number; data: { base64Data?: string; rawData?: string }; id?: number; name?: string },
    trx: Knex.Transaction
  ) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.update`)
    if (!id && !name) throw new Error(`id or name must be given to store.clusterfile.update`)
    if (!rawData && !base64Data)
      throw new Error(`data.rawData or data.base64Data param must be given to store.clusterfile.update`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(config.TABLES.clusterfile)
      .where(queryParams)
      .update({
        base64data: base64Data || base64.encode(rawData),
      })
      .returning('*')
    return result
  }
}
