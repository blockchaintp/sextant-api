const config = require('../config')
const utils = require('../utils/user')

const userForms = require('../forms/user')
const validate = require('../forms/validate')

const UserController = ({ store, settings }) => {
  
  if(!settings) throw new Error(`settings required for user controller`)
  if(!settings.tokenSecret) throw new Error(`settings.tokenSecret required for user controller`)
  
  /*
  
    count the number of users

    params:

  */
  const count = async (params) => {
    const users = await store.user.list({})
    return users.length
  }

  /*
  
    list the current users

    params:

    returns:

      array[user]

  */
  const list = (params) => store.user.list({})

  /*
  
    get a user given the username or id

    params:

     * id
     * username
    
    one of username of id must be given
    
  */
  const get = ({
    id,
    username,
  }) => {
    if(!id && !username) throw new Error(`id or username required for controller.user.get`)
    return store.user.get({
      username,
      id,
    })
  }

  /*
  
    check a user password

    params:

     * username - string
     * password - string
    
  */
  const checkPassword = async ({
    username,
    password,
  }) => {
    if(!username) throw new Error(`username required for controller.user.checkPassword`)
    if(!password) throw new Error(`password required for controller.user.checkPassword`)
    const user = await get({
      username,
    })
    if(!user) return false
    const result = await utils.compareHashedPasswords(password, user.hashed_password)
    return result
  }

  /*
  
    add a new user

    params:

     * username - string
     * password - string
     * permission - enumerations.PERMISSION_USER
    
  */
  const create = async ({
    username,
    password,
    permission,
  }) => {

    if(!username) throw new Error(`username required for controller.user.create`)
    if(!password) throw new Error(`password required for controller.user.create`)
    if(!permission) throw new Error(`permission required for controller.user.create`)

    const existingUsers = await count({})

    const formData = {
      username,
      password,
      permission: existingUsers == 0 ? config.PERMISSION_USER.superuser : permission,
    }

    await validate({
      schema: userForms.server.add,
      data: formData,
    })

    const hashed_password = await utils.getPasswordHash(password)

    return store.user.create({
      data: {
        username,
        permission: formData.permission,
        hashed_password,
        server_side_key: utils.getTokenServerSideKey(),
      }
    })
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
  const update = async ({
    id,
    data,
  }) => {

    if(!id) throw new Error(`id must be given to controller.user.update`)
    if(!data) throw new Error(`data param must be given to controller.user.update`)

    // check someone is not trying to manually overwrite a users server_side_key
    if(data.server_side_key) throw new Error(`access denied`)

    await validate({
      schema: userForms.server.edit,
      data,
    })

    if(data.password) {
      const hashed_password = await utils.getPasswordHash(data.password)
      data = Object.assign({}, data, {
        hashed_password,
      })
      delete(data.password)
    }

    return store.user.update({
      id,
      data,
    })    
  }

  /*
  
    get a users token

    params:

      * id
    
  */
  const getToken = async ({
    id,
  }) => {

    if(!id) throw new Error(`id must be given to controller.user.getToken`)

    const user = await get({
      id,
    })

    return utils.getToken(id, user.server_side_key, settings.tokenSecret)
  }

  /*
  
    update a users token server_side_key

    params:

      * id
    
  */
  const updateToken = async ({
    id,
  }) => {

    if(!id) throw new Error(`id must be given to controller.user.updateToken`)

    await store.user.update({
      id,
      data: {
        server_side_key: utils.getTokenServerSideKey(),
      },
    })

    return getToken({
      id,
    })
  }

  /*
  
    delete a user

    params:

     * id
    
  */
  const del = ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.user.delete`)
    return store.user.delete({
      id,
    })
  }

  return {
    count,
    list,
    get,
    checkPassword,
    create,
    update,
    getToken,
    updateToken,
    delete: del,
  }

}

module.exports = UserController