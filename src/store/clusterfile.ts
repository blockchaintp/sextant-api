import { Knex } from 'knex'
import * as config from '../config'
import * as base64 from '../utils/base64'

export class ClusterFileStore {
  protected knex: Knex
  protected orderBy: { direction: string; field: string }
  protected table: string

  constructor(
    knex: Knex,
    table: string = config.TABLES.clusterfile,
    orderBy: { direction: string; field: string } = config.LIST_ORDER_BY_FIELDS.clusterfile
  ) {
    this.knex = knex
    this.table = table
    this.orderBy = orderBy
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
    if (!cluster) throw new Error(`data.cluster param must be given to create`)
    if (!name) throw new Error(`data.name param must be given to create`)
    if (!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to create`)

    const insertData = {
      cluster,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    const [result] = await (trx || this.knex)(this.table).insert(insertData).returning('*')
    return result
  }

  /*
    delete a single clusterfile
    params:
      * cluster
      * id or name
  */
  public async delete({ cluster, id, name }: { cluster: number; id?: number; name?: string }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to delete`)
    if (!id && !name) throw new Error(`id or name must be given to delete`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(this.table).where(queryParams).del().returning('*')
    return result
  }

  /*
    delete all files for a cluster
    params:
      * cluster
  */
  public async deleteForCluster({ cluster }: { cluster: number }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.del`)
    const [result] = await (trx || this.knex)(this.table)
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
    if (!cluster) throw new Error(`cluster must be given to get`)
    if (!id && !name) throw new Error(`id or name must be given to get`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || this.knex).select('*').from(this.table).where(queryParams).first()
  }

  /*
    list all files for a single cluster
    params:
      * cluster
  */
  public list({ cluster }: { cluster: number }, trx: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to list`)

    return (trx || this.knex)
      .select('*')
      .from(this.table)
      .where({
        cluster,
      })
      .orderBy(this.orderBy.field, this.orderBy.direction)
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
    if (!cluster) throw new Error(`cluster must be given to update`)
    if (!id && !name) throw new Error(`id or name must be given to update`)
    if (!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to update`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(this.table)
      .where(queryParams)
      .update({
        base64data: base64Data || base64.encode(rawData),
      })
      .returning('*')
    return result
  }
}
