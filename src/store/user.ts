import { Knex } from 'knex'
import { DatabaseIdentifier, UserName } from './domain-types'
import { UserEntity } from './entity-types'
import { UserCreateRequest, UserDeleteRequest, UserGetRequest, UserUpdateRequest } from './request-types'

export const TABLE = 'useraccount'

const ORDER_BY_FIELDS = {
  field: 'username',
  direction: 'asc',
}

const UserStore = (knex: Knex) => {
  /*

    list all users

    params:

  */
  // eslint-disable-next-line no-empty-pattern
  const list = (trx?: Knex.Transaction) => {
    const orderBy = ORDER_BY_FIELDS

    return (trx || knex).select('*').from(TABLE).orderBy(orderBy.field, orderBy.direction)
  }

  /*

    get a single user

    params:

      * id or username

      * transaction - used if present

    one of id or username must be given

  */
  const get = ({ id, username }: UserGetRequest, trx?: Knex.Transaction) => {
    if (!id && !username) throw new Error('one of id or username must be given to store.user.get')

    const query: {
      id?: DatabaseIdentifier
      username?: UserName
    } = {}
    if (id) query.id = id
    if (username) query.username = username

    return (trx || knex).select('*').from<UserEntity>(TABLE).where(query).first()
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
  const create = async (
    { data: { username, hashed_password, server_side_key, permission, meta } }: UserCreateRequest,
    trx?: Knex.Transaction
  ) => {
    if (!username) throw new Error('data.username param must be given to store.user.create')
    if (!hashed_password) throw new Error('data.hashed_password param must be given to store.user.create')
    if (!server_side_key) throw new Error('data.server_side_key param must be given to store.user.create')
    if (!permission) throw new Error('data.permission param must be given to store.user.create')

    const [result] = await (trx || knex)<UserEntity>(TABLE)
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
  const update = async ({ id, data }: UserUpdateRequest, trx?: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.user.update')
    if (!data) throw new Error('data param must be given to store.user.update')

    const [result] = await (trx || knex)<UserEntity>(TABLE)
      .where({
        id,
      })
      .update(data)
      .returning('*')
    return result
  }

  /*

    delete a single user

    params:

      * id

  */
  const del = async ({ id }: UserDeleteRequest, trx?: Knex.Transaction) => {
    if (!id) throw new Error('id must be given to store.user.delete')

    const [result] = await (trx || knex)<UserEntity>(TABLE)
      .where({
        id,
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
  }
}

export default UserStore
