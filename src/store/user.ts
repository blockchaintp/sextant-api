/* eslint-disable camelcase */
import { Knex } from 'knex'
import { LIST_ORDER_BY_FIELDS, TABLES } from '../config'
import { User } from './model/model-types'
import { DatabaseIdentifier } from './model/scalar-types'

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
    {
      data: { username, hashed_password, server_side_key, permission, meta },
    }: {
      data: Pick<User, 'username' | 'hashed_password' | 'server_side_key' | 'permission'> & Partial<Pick<User, 'meta'>>
    },
    trx?: Knex.Transaction
  ) {
    if (!username) throw new Error('data.username param must be given to store.user.create')
    if (!hashed_password) throw new Error('data.hashed_password param must be given to store.user.create')
    if (!server_side_key) throw new Error('data.server_side_key param must be given to store.user.create')
    if (!permission) throw new Error('data.permission param must be given to store.user.create')

    const [result] = await (trx || this.knex)<User>(TABLES.user)
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
  public async delete({ id }: { id: DatabaseIdentifier }, trx?: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.user.delete')

    const [result] = await (trx || this.knex)<User>(TABLES.user)
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
  public get({ id, username }: Partial<Pick<User, 'id' | 'username'>>, trx?: Knex.Transaction) {
    if (!id && !username) throw new Error('one of id or username must be given to store.user.get')

    const query: Partial<Pick<User, 'id' | 'username'>> = {}
    if (id) query.id = id
    if (username) query.username = username

    return (trx || this.knex).select<User>('*').from(TABLES.user).where(query).first()
  }

  /*
    list all users
    params:
  */
  // eslint-disable-next-line no-empty-pattern
  public list(trx?: Knex.Transaction) {
    const orderBy = LIST_ORDER_BY_FIELDS.user

    return (trx || this.knex)<User>(TABLES.user)
      .from(TABLES.user)
      .orderBy(orderBy.field, orderBy.direction)
      .returning<User[]>('*')
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
  public async update(
    { id, data }: { data: Partial<Omit<User, 'id'>>; id: DatabaseIdentifier },
    trx?: Knex.Transaction
  ) {
    if (!id) throw new Error('id must be given to store.user.update')
    if (!data) throw new Error('data param must be given to store.user.update')

    const [result] = await (trx || this.knex)<User>(TABLES.user)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    return result
  }
}
