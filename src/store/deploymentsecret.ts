import { Knex } from 'knex'
import * as config from '../config'
import * as base64 from '../utils/base64'

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

export class DeploymentSecretStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new deploymentsecret
    params:
      * data
        * deployment
        * name
        * rawData || base64Data
  */
  public async create({ data: { deployment, name, rawData, base64Data } }, trx: Knex.Transaction) {
    if (!deployment) throw new Error(`data.deployment param must be given to store.deploymentsecret.create`)
    if (!name) throw new Error(`data.name param must be given to store.deploymentsecret.create`)
    if (!rawData && !base64Data)
      throw new Error(`data.rawData or data.base64Data param must be given to store.deploymentsecret.create`)

    const insertData = {
      deployment,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    const [result] = await (trx || this.knex)(config.TABLES.deploymentsecret).insert(insertData).returning('*')
    return result
  }

  /*
    delete a single deploymentsecret
    params:
      * deployment
      * id or name
  */
  public async delete(
    { deployment, id, name }: { deployment: number; id?: number; name?: string },
    trx: Knex.Transaction
  ) {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.del`)
    if (!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.del`)

    const queryParams: { deployment: number; id?: number; name?: string } = {
      deployment,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(config.TABLES.deploymentsecret).where(queryParams).del().returning('*')
    return result
  }

  /*
    delete all secrets for a deployment
    params:
      * deployment
  */
  public async deleteForDeployment({ deployment }: { deployment: number }, trx: Knex.Transaction) {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.deleteForDeployment`)
    const [result] = await (trx || this.knex)(config.TABLES.deploymentsecret)
      .where({
        deployment,
      })
      .del()
      .returning('*')
    return result
  }

  /*
    get a single secret for a single deployment
    params:
      * deployment
      * id or name
  */
  public get({ deployment, id, name }: { deployment: number; id?: number; name?: string }, trx: Knex.Transaction) {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.get`)
    if (!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.get`)

    const queryParams: { deployment: number; id?: number; name?: string } = {
      deployment,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    return (trx || this.knex).select('*').from(config.TABLES.deploymentsecret).where(queryParams).first()
  }

  /*
    list all secrets for a single deployment
    params:
      * deployment
  */
  public list({ deployment }: { deployment: number }, trx: Knex.Transaction) {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.deploymentsecret

    return (trx || this.knex)
      .select('*')
      .from(config.TABLES.deploymentsecret)
      .where({
        deployment,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*
    replace a single deploymentsecret
    i.e. one of create or update
    params:
      * data
        * deployment
        * name
        * rawData || base64Data
  */
  public async replace({ data: { deployment, name, rawData, base64Data } }, trx: Knex.Transaction) {
    await this.delete(
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        deployment,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name,
      },
      trx
    )

    return this.create(
      {
        data: {
          deployment,
          name,
          rawData,
          base64Data,
        },
      },
      trx
    )
  }

  /*
    update a deploymentsecret
    params:
      * deployment
      * id or name
      * data
        * rawData || base64Data
  */
  public async update(
    {
      deployment,
      id,
      name,
      data: { rawData, base64Data },
    }: { data: { base64Data?: string; rawData?: string }; deployment: number; id?: number; name?: string },
    trx: Knex.Transaction
  ) {
    if (!deployment) throw new Error(`deployment must be given to store.deploymentsecret.update`)
    if (!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.update`)
    if (!rawData && !base64Data)
      throw new Error(`data.rawData or data.base64Data param must be given to store.deploymentsecret.update`)

    const queryParams: { deployment: number; id?: number; name?: string } = {
      deployment,
    }

    if (id) queryParams.id = id
    if (name) queryParams.name = name

    const [result] = await (trx || this.knex)(config.TABLES.deploymentsecret)
      .where(queryParams)
      .update({
        base64data: base64Data || base64.encode(rawData),
      })
      .returning('*')
    return result
  }
}
