import { Knex } from 'knex'

import * as config from '../config'

export class UserStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new user
    params:
      * data
        * username
        * hashed_password
        * server_side_key
        * permission
        * meta
  */
  public async create(
    { data: { username, hashed_password, server_side_key, permission, meta } },
    trx: Knex.Transaction
  ) {
    if (!username) throw new Error('data.username param must be given to store.user.create')
    if (!hashed_password) throw new Error('data.hashed_password param must be given to store.user.create')
    if (!server_side_key) throw new Error('data.server_side_key param must be given to store.user.create')
    if (!permission) throw new Error('data.permission param must be given to store.user.create')

    const [result] = await (trx || this.knex)(config.TABLES.user)
      .insert({
        username,
        hashed_password,
        server_side_key,
        permission,
        meta,
      })
      .returning('*')

    return result
  }

  /*
    delete a single user
    params:
      * id
  */
  public async delete({ id }: { id: number }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.user.delete')

    const [result] = await (trx || this.knex)(config.TABLES.user)
      .where({
        id,
      })
      .del()
      .returning('*')
    return result
  }

  /*
    get a single user
    params:
      * id or username
      * transaction - used if present
    one of id or username must be given
  */
  public get({ id, username }: { id?: number; username?: string }, trx: Knex.Transaction) {
    if (!id && !username) throw new Error('one of id or username must be given to store.user.get')

    const query: {
      id?: number
      username?: string
    } = {}
    if (id) query.id = id
    if (username) query.username = username

    return (trx || this.knex).select('*').from(config.TABLES.user).where(query).first()
  }

  /*
    list all users
    params:
  */
  // eslint-disable-next-line no-empty-pattern
  public list(trx: Knex.Transaction) {
    const orderBy = config.LIST_ORDER_BY_FIELDS.user

    return (trx || this.knex).select('*').from(config.TABLES.user).orderBy(orderBy.field, orderBy.direction)
  }

  /*
    update a user
    params:
      * id
      * data (all optional)
        * username
        * hashed_password
        * permission
        * meta
    one of id or username must be given
  */
  public async update({ id, data }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.user.update')
    if (!data) throw new Error('data param must be given to store.user.update')

    const [result] = await (trx || this.knex)(config.TABLES.user)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    return result
  }
}
