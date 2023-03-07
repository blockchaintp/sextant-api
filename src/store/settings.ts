/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

import { Knex } from 'knex'
import { Setting } from './model/model-types'

export class SettingsStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new settings
    params:
      * data
        * deployment
        * key
        * value || base64data
  */
  public async create({ data: { key, value } }: { data: Pick<Setting, 'key' | 'value'> }, trx?: Knex.Transaction) {
    if (!key) throw new Error('data.key param must be given to store.settings.create')
    if (!value) throw new Error('data.value param must be given to store.settings.create')

    const insertData = {
      key,
      value,
    }

    const [result] = await (trx || this.knex)<Setting>('settings').insert(insertData).returning('*')
    return result
  }

  /*
    delete a single settings
    params:
      * id or key
  */
  public async delete({ id, key }: { id?: number; key?: string }, trx?: Knex.Transaction) {
    if (!id && !key) throw new Error('id or key must be given to store.settings.del')

    const queryParams: {
      id?: number
      key?: string
    } = {}

    if (id) queryParams.id = id
    if (key) queryParams.key = key

    const [result] = await (trx || this.knex)<Setting>('settings').where(queryParams).del().returning('*')
    return result
  }

  /*
    get a single setting
    params:
      * id or key
  */
  public get({ id, key }: { id?: number; key?: string }, trx?: Knex.Transaction) {
    if (!id && !key) throw new Error('id or key must be given to store.settings.get')

    const queryParams: {
      id?: number
      key?: string
    } = {}

    if (id) queryParams.id = id
    if (key) queryParams.key = key

    return (trx || this.knex).select<Setting>('*').from('settings').where(queryParams).first<Setting>()
  }

  /*
    list all settings for sextant
  */
  // eslint-disable-next-line no-empty-pattern
  public list(trx?: Knex.Transaction) {
    return (trx || this.knex).select<Setting>('*').from('settings')
  }

  /*
    update a setting
    params:
      * key, value
  */
  public async update(
    {
      key,
      data: { value },
    }: {
      data: Pick<Setting, 'value'>
      key: string
    },
    trx?: Knex.Transaction
  ) {
    if (!key) throw new Error('key must be given to store.settings.update')
    if (!value) throw new Error('data.value param must be given to store.settings.update')

    const queryParams = {
      key,
    }

    if (key) queryParams.key = key

    const [result] = await (trx || this.knex)<Setting>('settings')
      .where(queryParams)
      .update({
        value,
      })
      .returning('*')
    return result
  }
}
