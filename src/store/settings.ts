/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

import { Knex } from 'knex'
import { DatabaseIdentifier } from './domain-types'
import { SettingsEntity } from './entity-types'
import {
  SettingsCreateRequest,
  SettingsDeleteRequest,
  SettingsGetRequest,
  SettingsUpdateRequest,
} from './request-types'

export const TABLE = 'settings'

const SettingsStore = (knex: Knex) => {
  /*

    list all settings for sextant

  */
  // eslint-disable-next-line no-empty-pattern
  const list = (trx: Knex.Transaction) => (trx || knex).select('*').from<SettingsEntity>(TABLE)

  /*

    get a single setting

    params:

      * id or key

  */
  const get = ({ id, key }: SettingsGetRequest, trx: Knex.Transaction) => {
    if (!id && !key) throw new Error('id or key must be given to store.settings.get')

    const queryParams: {
      id?: DatabaseIdentifier
      key?: string
    } = {}

    if (id) queryParams.id = id
    if (key) queryParams.key = key

    return (trx || knex).select('*').from<SettingsEntity>(TABLE).where(queryParams).first()
  }

  /*

    insert a new settings

    params:

      * data
        * deployment
        * key
        * value

  */
  const create = async ({ data: { key, value } }: SettingsCreateRequest, trx: Knex.Transaction) => {
    if (!key) throw new Error('data.key param must be given to store.settings.create')
    if (!value) throw new Error('data.value param must be given to store.settings.create')

    const insertData = {
      key,
      value,
    }

    const [result] = await (trx || knex)<SettingsEntity>(TABLE).insert(insertData).returning('*')
    return result
  }

  /*

    update a setting

    params:

      * key, value

  */
  const update = async ({ key, data: { value } }: SettingsUpdateRequest, trx: Knex.Transaction) => {
    if (!key) throw new Error('key must be given to store.settings.update')
    if (!value) throw new Error('data.value param must be given to store.settings.update')

    const queryParams = {
      key,
    }

    if (key) queryParams.key = key

    const [result] = await (trx || knex)<SettingsEntity>(TABLE)
      .where(queryParams)
      .update({
        value,
      })
      .returning('*')
    return result
  }

  /*

    delete a single settings

    params:

      * id or key

  */
  const del = async ({ id, key }: SettingsDeleteRequest, trx: Knex.Transaction) => {
    if (!id && !key) throw new Error('id or key must be given to store.settings.del')

    const queryParams: SettingsDeleteRequest = {}

    if (id) queryParams.id = id
    if (key) queryParams.key = key

    const [result] = await (trx || knex)<SettingsEntity>(TABLE).where(queryParams).del().returning('*')
    return result
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
  }
}

export default SettingsStore
