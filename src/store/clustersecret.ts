import { Knex } from 'knex'
import { encode } from '../utils/base64'
import { DatabaseIdentifier } from './domain-types'
import { ClusterSecretEntity } from './entity-types'
import {
  ClusterSecretCreateRequest,
  ClusterSecretDeleteForClusterRequest,
  ClusterSecretDeleteRequest,
  ClusterSecretGetRequest,
  ClusterSecretListRequest,
  ClusterSecretReplaceRequest,
  ClusterSecretUpdateRequest,
} from './request-types'

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/
export const TABLE = 'clustersecret'

const ORDER_BY_FIELDS = {
  field: 'name',
  direction: 'asc',
}

const ClusterSecretStore = (knex: Knex) => {
  /*

    list all secrets for a single cluster

    params:

      * cluster

  */
  const list = ({ cluster }: ClusterSecretListRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.list`)

    const orderBy = ORDER_BY_FIELDS

    return (trx || knex)
      .select('*')
      .from<ClusterSecretEntity>(TABLE)
      .where({
        cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*

    get a single secret for a single cluster

    params:

      * cluster
      * id or name

  */
  const get = ({ cluster, id, name }: ClusterSecretGetRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.clustersecret.get`)

    const queryParams: {
      id?: DatabaseIdentifier
      name?: string
      cluster: DatabaseIdentifier
    } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || knex).select('*').from<ClusterSecretEntity>(TABLE).where(queryParams).first()
  }

  /*

    insert a new clustersecret

    params:

      * data
        * cluster
        * name
        * rawData || base64data

  */
  const create = async (
    { data: { cluster, name, rawData, base64data } }: ClusterSecretCreateRequest,
    trx: Knex.Transaction
  ) => {
    if (!cluster) throw new Error(`data.cluster param must be given to store.clustersecret.create`)
    if (!name) throw new Error(`data.name param must be given to store.clustersecret.create`)
    let theData
    if (rawData) {
      theData = encode(rawData)
    } else if (base64data) {
      theData = base64data
    } else {
      throw new Error(`data.rawData or data.base64data param must be given to store.clustersecret.create`)
    }

    const insertData = {
      cluster,
      name,
      base64data: theData,
    }

    const [result] = await (trx || knex)<ClusterSecretEntity>(TABLE).insert(insertData).returning('*')
    return result
  }

  /*

    update a clustersecret

    params:

      * cluster
      * id or name
      * data
        * rawData || base64data

  */
  const update = async (
    { cluster, id, name, data: { rawData, base64data } }: ClusterSecretUpdateRequest,
    trx: Knex.Transaction
  ) => {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.update`)
    if (!id && !name) throw new Error(`id or name must be given to store.clustersecret.update`)
    let theData
    if (rawData) {
      theData = encode(rawData)
    } else if (base64data) {
      theData = base64data
    } else {
      throw new Error(`data.rawData or data.base64data param must be given to store.clustersecret.update`)
    }

    const queryParams: {
      cluster: DatabaseIdentifier
      id?: DatabaseIdentifier
      name?: string
    } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || knex)<ClusterSecretEntity>(TABLE)
      .where(queryParams)
      .update({
        base64data: theData,
      })
      .returning('*')
    return result
  }

  /*

    delete a single clustersecret

    params:

      * cluster
      * id or name

  */
  const del = async ({ cluster, id, name }: ClusterSecretDeleteRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.del`)
    if (!id && !name) throw new Error(`id or name must be given to store.clustersecret.del`)

    const queryParams: {
      cluster: DatabaseIdentifier
      id?: DatabaseIdentifier
      name?: string
    } = {
      cluster,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || knex)<ClusterSecretEntity>(TABLE).where(queryParams).del().returning('*')
    return result
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
  const replace = async (
    { data: { cluster, name, rawData, base64data } }: ClusterSecretReplaceRequest,
    trx: Knex.Transaction
  ) => {
    await del(
      {
        cluster,
        name,
      },
      trx
    )

    return create(
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

    delete all secrets for a cluster

    params:

      * cluster

  */
  const deleteForCluster = async ({ cluster }: ClusterSecretDeleteForClusterRequest, trx: Knex.Transaction) => {
    if (!cluster) throw new Error(`cluster must be given to store.clustersecret.deleteForCluster`)
    const [result] = await (trx || knex)<ClusterSecretEntity>(TABLE)
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
    replace,
    deleteForCluster,
  }
}

export default ClusterSecretStore
