import { Knex } from 'knex'
import * as config from '../config'

export class RoleStore {
  private knex: Knex

  constructor(knex: Knex) {
    this.knex = knex
  }

  /*
    insert a new role
    params:
      * data
        * user
        * permission
        * resource_type
        * resource_id

  */
  public async create({ data: { user, permission, resource_type, resource_id } }, trx: Knex.Transaction) {
    if (!user) throw new Error('data.user param must be given to store.role.create')
    if (!permission) throw new Error('data.permission param must be given to store.role.create')
    if (!resource_type) throw new Error('data.resource_type param must be given to store.role.create')
    if (!resource_id) throw new Error('data.resource_id param must be given to store.role.create')

    const [result] = await (trx || this.knex)(config.TABLES.role)
      .insert({
        user,
        permission,
        resource_type,
        resource_id,
      })
      .returning('*')
    return result
  }

  /*
    delete a role
    params:
     * id
  */
  public async delete({ id }, trx: Knex.Transaction) {
    if (!id) throw new Error('id must be given to store.role.delete')
    const [result] = await (trx || this.knex)(config.TABLES.role)
      .where({
        id,
      })
      .del()
      .returning('*')
    return result
  }

  /*
    delete roles for a resource
    params:
     * id
  */
  public deleteForResource({ resource_type, resource_id }, trx: Knex.Transaction) {
    if (!resource_type) throw new Error('resource_type must be given to store.role.deleteForResource')
    if (!resource_id) throw new Error('resource_type must be given to store.role.deleteForResource')
    return (trx || this.knex)(config.TABLES.role)
      .where({
        resource_type,
        resource_id,
      })
      .del()
      .returning('*')
  }

  /*
    get a single role for a user on a certain resource
    params:
      * user
      * resource_type
      * resource_id

  */
  public get({ user, resource_type, resource_id }, trx: Knex.Transaction) {
    if (!user) throw new Error('user must be given to store.role.listForUser')
    if (!resource_type) throw new Error('resource_type must be given to store.role.listForUser')
    if (!resource_id) throw new Error('resource_id must be given to store.role.listForUser')

    return (trx || this.knex)
      .select('*')
      .from(config.TABLES.role)
      .where({
        user,
        resource_type,
        resource_id,
      })
      .first()
  }

  /*
    list all roles for a given resource
    params:
      * resource_type
      * resource_id
  */
  public listForResource({ resource_type, resource_id }, trx: Knex.Transaction) {
    if (!resource_type) throw new Error('resource_type must be given to store.role.listForResource')
    if (!resource_id) throw new Error('resource_type must be given to store.role.listForResource')

    return (trx || this.knex).select('*').from(config.TABLES.role).where({
      resource_type,
      resource_id,
    })
  }

  /*
    list all roles for a given user
    params:
      * user
  */
  public listForUser({ user }, trx: Knex.Transaction) {
    if (!user) throw new Error('user must be given to store.role.listForUser')

    return (trx || this.knex).select('*').from(config.TABLES.role).where({
      user,
    })
  }
}
