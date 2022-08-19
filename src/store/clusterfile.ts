import { Knex } from 'knex'
import { encode } from '../utils/base64'
import { DatabaseIdentifier } from './domain-types'
import { ClusterFileEntity } from './entity-types'
import {
  ClusterFileCreateRequest,
  ClusterFileDeleteForClusterRequest,
  ClusterFileDeleteRequest,
  ClusterFileGetRequest,
  ClusterFileListRequest,
  ClusterFileUpdateRequest,
} from './request-types'

export const TABLE = 'clusterfile'

const ORDER_BY_FIELDS = {
  field: 'name',
  direction: 'asc',
}

const ClusterFileStore = (knex: Knex) => {
  /*

    list all files for a single cluster

    params:

      * cluster

  */
  const list = ({ cluster }: ClusterFileListRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.list`)

    const orderBy = ORDER_BY_FIELDS

    return (trx || knex)
      .select('*')
      .from<ClusterFileEntity>(TABLE)
      .where({
        cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*

    get a single file for a single cluster

    params:

      * cluster
      * id or name

  */
  const get = ({ cluster, id, name }: ClusterFileGetRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.clusterfile.get`)

    const queryParams: {
      cluster: DatabaseIdentifier
      id?: DatabaseIdentifier
      name?: string
    } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || knex)<ClusterFileEntity>(TABLE).select('*').where(queryParams).first()
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
  const create = async (
    { data: { cluster, name, rawData, base64data } }: ClusterFileCreateRequest,
    trx: Knex.Transaction
  ) => {
    if (!cluster) throw new Error(`data.cluster param must be given to store.clusterfile.create`)
    if (!name) throw new Error(`data.name param must be given to store.clusterfile.create`)
    let theData
    if (base64data) {
      theData = base64data
    } else if (rawData) {
      theData = encode(rawData)
    } else {
      throw new Error(`data.rawData or data.base64data param must be given to store.clusterfile.create`)
    }

    const insertData = {
      cluster,
      name,
      base64data: theData,
    }
    const [result] = await (trx || knex)<ClusterFileEntity>(TABLE).insert(insertData).returning('*')
    return result
  }

  /*

    update a clusterfile

    params:

      * cluster
      * id or name
      * data
        * rawData

  */
  const update = async (
    { cluster, id, name, data: { rawData, base64data } }: ClusterFileUpdateRequest,
    trx: Knex.Transaction
  ) => {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.update`)
    if (!id && !name) throw new Error(`id or name must be given to store.clusterfile.update`)
    let theData
    if (rawData) {
      theData = encode(rawData)
    } else if (base64data) {
      theData = base64data
    } else {
      throw new Error(`data.rawData or data.base64data param must be given to store.clusterfile.update`)
    }

    const queryParams: {
      id?: DatabaseIdentifier
      name?: string
      cluster: DatabaseIdentifier
    } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || knex)<ClusterFileEntity>(TABLE)
      .where(queryParams)
      .update({
        base64data: theData,
      })
      .returning('*')
    return result
  }

  /*

    delete a single clusterfile

    params:

      * cluster
      * id or name

  */
  const del = async ({ cluster, id, name }: ClusterFileDeleteRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.clusterfile.get`)

    const queryParams: {
      id?: DatabaseIdentifier
      name?: string
      cluster: DatabaseIdentifier
    } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || knex)<ClusterFileEntity>(TABLE).where(queryParams).del().returning('*')
    return result
  }

  /*

    delete all files for a cluster

    params:

      * cluster

  */
  const deleteForCluster = async ({ cluster }: ClusterFileDeleteForClusterRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clusterfile.del`)
    const result = await (trx || knex)<ClusterFileEntity>(TABLE)
      .where({
        cluster,
      })
      .del()
      .returning('*')
    return result
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    deleteForCluster,
  }
}

export default ClusterFileStore
