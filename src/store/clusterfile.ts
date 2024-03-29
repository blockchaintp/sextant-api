import { Knex } from 'knex'
import { LIST_ORDER_BY_FIELDS, TABLES } from '../config'
import { encode } from '../utils/base64'
import { ClusterFile } from './model/model-types'
import { DatabaseIdentifier } from './model/scalar-types'
import {
  ClusterFileCreateRequest,
  ClusterFileDeleteForClusterRequest,
  ClusterFileDeleteRequest,
  ClusterFileGetRequest,
  ClusterFileListRequest,
  ClusterFileReplaceRequest,
  ClusterFileUpdateRequest,
} from './signals'

export type ClusterFileIdentifying = {
  cluster: DatabaseIdentifier
  id?: DatabaseIdentifier
  name?: string
}

export class ClusterFileStore {
  protected knex: Knex
  protected orderBy: { direction: string; field: string }
  protected table: string

  constructor(
    knex: Knex,
    table: string = TABLES.clusterfile,
    orderBy: { direction: string; field: string } = LIST_ORDER_BY_FIELDS.clusterfile
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
        * base64data
  */
  public async create(
    { data: { cluster, name, rawData, base64data } }: ClusterFileCreateRequest,
    trx?: Knex.Transaction
  ) {
    if (!cluster) throw new Error(`data.cluster param must be given to create`)
    if (!name) throw new Error(`data.name param must be given to create`)
    if (!base64data && !rawData) throw new Error(`data.rawData or data.base64data param must be given to create`)

    let insertData: Partial<ClusterFile>
    if (base64data) {
      insertData = {
        cluster,
        name,
        base64data,
      }
    } else {
      if (rawData) {
        insertData = {
          cluster,
          name,
          base64data: encode(rawData),
        }
      } else {
        throw new Error(`data.rawData or data.base64data param must be given to create`)
      }
    }

    const [result] = await (trx || this.knex)<ClusterFile>(this.table).insert(insertData).returning('*')
    return result
  }

  /*
    delete a single clusterfile
    params:
      * cluster
      * id or name
  */
  public async delete({ cluster, id, name }: ClusterFileDeleteRequest, trx?: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to delete`)
    if (!id && !name) throw new Error(`id or name must be given to delete`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)<ClusterFile>(this.table).where(queryParams).del().returning('*')
    return result
  }

  /*
    delete all files for a cluster
    params:
      * cluster
  */
  public async deleteForCluster({ cluster }: ClusterFileDeleteForClusterRequest, trx?: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.del`)
    const [result] = await (trx || this.knex)<ClusterFile>(this.table)
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
  public get({ cluster, id, name }: ClusterFileGetRequest, trx?: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to get`)
    if (!id && !name) throw new Error(`id or name must be given to get`)

    const queryParams: ClusterFileIdentifying = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || this.knex).select<ClusterFile>('*').from(this.table).where(queryParams).first()
  }

  /*
    list all files for a single cluster
    params:
      * cluster
  */
  public list({ cluster }: ClusterFileListRequest, trx?: Knex.Transaction) {
    if (!cluster) throw new Error(`cluster must be given to list`)

    return (trx || this.knex)
      .select<ClusterFile>('*')
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
        * rawData || base64data
  */
  public async replace(
    { data: { cluster, name, rawData, base64data } }: ClusterFileReplaceRequest,
    trx?: Knex.Transaction
  ) {
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
          base64data,
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
    { cluster, id, name, data: { rawData, base64data } }: ClusterFileUpdateRequest,
    trx?: Knex.Transaction
  ) {
    if (!cluster) throw new Error(`cluster must be given to update`)
    if (!id && !name) throw new Error(`id or name must be given to update`)
    if (!rawData && !base64data) throw new Error(`data.rawData or data.base64data param must be given to update`)

    const queryParams: { cluster: number; id?: number; name?: string } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    let updateData: { base64data: string }
    if (base64data) {
      updateData = { base64data }
    } else {
      if (rawData) {
        updateData = { base64data: encode(rawData) }
      } else {
        throw new Error(`data.rawData or data.base64data param must be given to update`)
      }
    }

    const [result] = await (trx || this.knex)<ClusterFile>(this.table)
      .where(queryParams)
      .update(updateData)
      .returning('*')
    return result
  }
}
