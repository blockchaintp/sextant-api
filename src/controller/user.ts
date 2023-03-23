/* eslint-disable no-shadow */
import * as config from '../config'
import * as utils from '../utils/user'

import userForms from '../forms/user'
import validate from '../forms/validate'
import { Store } from '../store'
import { DatabaseIdentifier } from '../store/model/scalar-types'
import { Settings } from '../settings-singleton'

export class UserController {
  private settings: Settings
  private store: Store

  constructor({ store, settings }: { settings: Settings; store: Store }) {
    if (!settings) throw new Error('settings required for user controller')
    if (!settings.tokenSecret) throw new Error('settings.tokenSecret required for user controller')
    this.store = store
    this.settings = settings
  }

  /*
    check a user password
    params:
     * username - string
     * password - string
  */
  public async checkPassword({ username, password }: { username: string; password: string }) {
    if (!username) throw new Error('username required for controller.user.checkPassword')
    if (!password) throw new Error('password required for controller.user.checkPassword')
    const user = await this.get({
      username,
    })
    if (!user) return false
    const result = await utils.compareHashedPasswords(password, user.hashed_password)
    return result
  }

  /*
    count the number of users
    params:
  */
  public async count() {
    const users = await this.store.user.list()
    return users.length
  }

  /*
    add a new user
    params:
     * username - string
     * password - string
     * permission - enumerations.USER_TYPES
  */
  public async create({ username, password, permission }: { username: string; password: string; permission: string }) {
    if (!username) throw new Error('username required for controller.user.create')
    if (!password) throw new Error('password required for controller.user.create')
    if (!permission) throw new Error('permission required for controller.user.create')

    const existingUsers = await this.count()

    const formData = {
      username,
      password,
      permission: existingUsers === 0 ? config.USER_TYPES.superuser : permission,
    }

    await validate({
      schema: userForms.server.add,
      data: formData,
    })

    const hashed_password = await utils.getPasswordHash(password)

    return this.store.user.create({
      data: {
        username,
        permission: formData.permission,
        hashed_password,
        server_side_key: utils.getTokenServerSideKey(),
      },
    })
  }

  /*
    delete a user
    params:
     * id
  */
  public delete({ id }: { id: DatabaseIdentifier }) {
    if (!id) throw new Error('id must be given to controller.user.delete')
    return this.store.user.delete({
      id,
    })
  }

  /*
    get a user given the username or id
    params:
     * id
     * username
    one of username of id must be given
  */
  public get({ id, username }: { id?: DatabaseIdentifier; username?: string }) {
    if (!id && !username) throw new Error('id or username required for controller.user.get')
    return this.store.user.get({
      id,
      username,
    })
  }

  /*
    get a users roles
    params:
      * id
  */
  public getRoles({ id }: { id: DatabaseIdentifier }) {
    return this.store.role.listForUser({
      user: id,
    })
  }

  /*
    get a users token
    params:
      * id
  */
  public async getToken({ id }: { id: DatabaseIdentifier }) {
    if (!id) throw new Error('id must be given to controller.user.getToken')

    const user = await this.get({
      id,
    })

    return utils.getToken(id, user.server_side_key, this.settings.tokenSecret)
  }

  /*
    list the current users
    params:
    returns:
      array[user]
  */
  public list() {
    return this.store.user.list()
  }

  /*
    search current users - used for the role form
    only return the username because all users should be able to
    add other users
  */
  public async search({ searchParams }: { searchParams: string }) {
    if (!searchParams) return []
    const users = await this.store.user.list()
    return users
      .filter((user) => user.username.toLowerCase().indexOf(searchParams.toLowerCase()) >= 0)
      .map((user) => ({
        id: user.id,
        permission: user.permission,
        username: user.username,
      }))
  }

  /*
    update a user
    params:
      * id
      * data (all optional)
        * username
        * password
        * permission
        * meta
  */
  public async update({
    id,
    data,
  }: {
    data: {
      [key: string]: unknown
      password?: string
      server_side_key?: string
    }
    id: DatabaseIdentifier
  }) {
    if (!id) throw new Error('id must be given to controller.user.update')
    if (!data) throw new Error('data param must be given to controller.user.update')

    // check someone is not trying to manually overwrite a users server_side_key
    if (data.server_side_key) throw new Error('access denied')

    await validate({
      schema: userForms.server.edit,
      data,
    })

    if (data.password) {
      const hashed_password = await utils.getPasswordHash(data.password)
      data = { ...data, hashed_password }
      delete data.password
    }

    return this.store.user.update({
      id,
      data,
    })
  }

  /*

    update a users token server_side_key

    params:

      * id

  */
  public async updateToken({ id }: { id: DatabaseIdentifier }) {
    await this.store.user.update({
      id,
      data: {
        server_side_key: utils.getTokenServerSideKey(),
      },
    })

    return this.getToken({
      id,
    })
  }
}
