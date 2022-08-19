import { Knex } from 'knex'
import { encode } from '../utils/base64'
import { DatabaseIdentifier } from './domain-types'
import { DeploymentSecretEntity } from './entity-types'
import {
  DeploymentSecretCreateRequest,
  DeploymentSecretDeleteForDeploymentRequest,
  DeploymentSecretDeleteRequest,
  DeploymentSecretGetRequest,
  DeploymentSecretListRequest,
  DeploymentSecretReplaceRequest,
  DeploymentSecretUpdateRequest,
} from './request-types'

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

export const TABLE = 'deploymentsecret'

const ORDER_BY_FIELDS = {
  field: 'name',
  direction: 'asc',
}

const DeploymentSecretStore = (knex: Knex) => {
  /*

    list all secrets for a single deployment

    params:

      * deployment

  */
  const list = ({ deployment }: DeploymentSecretListRequest, trx?: Knex.Transaction) => {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.list`)

    const orderBy = ORDER_BY_FIELDS

    return (trx || knex)
      .select('*')
      .from<DeploymentSecretEntity>(TABLE)
      .where({
        deployment,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*

    get a single secret for a single deployment

    params:

      * deployment
      * id or name

  */
  const get = ({ deployment, id, name }: DeploymentSecretGetRequest, trx?: Knex.Transaction) => {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.get`)

    const queryParams: {
      deployment: DatabaseIdentifier
      id?: DatabaseIdentifier
      name?: string
    } = {
      deployment,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || knex).select('*').from<DeploymentSecretEntity>(TABLE).where(queryParams).first()
  }

  /*

    insert a new deploymentsecret

    params:

      * data
        * deployment
        * name
        * rawData || base64data

  */
  const create = async (
    { data: { deployment, name, rawData, base64data } }: DeploymentSecretCreateRequest,
    trx?: Knex.Transaction
  ) => {
    if (!deployment) throw new Error(`data.deployment param must be given to store.deploymentsecret.create`)
    if (!name) throw new Error(`data.name param must be given to store.deploymentsecret.create`)
    let theData
    if (base64data) {
      theData = base64data
    } else if (rawData) {
      theData = encode(rawData)
    } else {
      throw new Error(`data.rawData or data.base64data param must be given to store.deploymentsecret.create`)
    }

    const insertData = {
      deployment,
      name,
      base64data: theData,
    }

    const [result] = await (trx || knex)<DeploymentSecretEntity>(TABLE).insert(insertData).returning('*')
    return result
  }

  /*

    update a deploymentsecret

    params:

      * deployment
      * id or name
      * data
        * rawData || base64data

  */
  const update = async (
    { deployment, id, name, data: { rawData, base64data } }: DeploymentSecretUpdateRequest,
    trx?: Knex.Transaction
  ) => {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.update`)
    if (!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.update`)
    let theData
    if (base64data) {
      theData = base64data
    } else if (rawData) {
      theData = encode(rawData)
    } else {
      throw new Error(`data.rawData or data.base64data param must be given to store.deploymentsecret.create`)
    }

    const queryParams: {
      deployment: any
      id?: DatabaseIdentifier
      name?: string
    } = {
      deployment,
    }
    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || knex)<DeploymentSecretEntity>(TABLE)
      .where(queryParams)
      .update({
        base64data: theData,
      })
      .returning('*')
    return result
  }

  /*

    delete a single deploymentsecret

    params:

      * deployment
      * id or name

  */
  const del = async ({ deployment, id, name }: DeploymentSecretDeleteRequest, trx?: Knex.Transaction) => {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.del`)
    if (!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.del`)

    const queryParams: {
      deployment: any
      id?: DatabaseIdentifier
      name?: string
    } = {
      deployment,
    }
    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || knex)<DeploymentSecretEntity>(TABLE).where(queryParams).del().returning('*')
    return result
  }

  /*

    replace a single deploymentsecret

    i.e. one of create or update

    params:

      * data
        * deployment
        * name
        * rawData || base64data

  */
  const replace = async (
    { data: { deployment, name, rawData, base64data } }: DeploymentSecretReplaceRequest,
    trx?: Knex.Transaction
  ) => {
    await del(
      {
        deployment,
        name,
      },
      trx
    )

    return create(
      {
        data: {
          deployment,
          name,
          rawData,
          base64data,
        },
      },
      trx
    )
  }

  /*

    delete all secrets for a deployment

    params:

      * deployment

  */
  const deleteForDeployment = async (
    { deployment }: DeploymentSecretDeleteForDeploymentRequest,
    trx?: Knex.Transaction
  ) => {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.deleteForDeployment`)
    const [result] = await (trx || knex)<DeploymentSecretEntity>(TABLE)
      .where({
        deployment,
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
    deleteForDeployment,
  }
}

export default DeploymentSecretStore
