const config = require('../config')

const RoleStore = (knex) => {

  /*
  
    list all roles for a given user

    params:

      * user
  
  */

  const listForUser = ({
    user,
  }, trx) => {
    if(!user) throw new Error(`user must be given to store.role.listForUser`)

    return (trx || knex).select('*')
      .from(config.TABLES.role)
      .where({
        user: params.user,
      })
  }

  /*
  
    list all roles for a given resource

    params:

      * resource_type
      * resource_id
  
  */

  const listForResource = ({
    resource_type,
    resource_id,
  }, trx) => {
    if(!resource_type) throw new Error(`resource_type must be given to store.role.listForResource`)
    if(!resource_id) throw new Error(`resource_type must be given to store.role.listForResource`)

    return (trx || knex).select('*')
      .from(config.TABLES.role)
      .where({
        resource_type: params.resource_type,
        resource_id: params.resource_id,
      })
  }

  /*
  
    get a single role for a user on a certain resource

    params:

      * user
      * resource_type
      * resource_id
  
  */

  const get = ({
    user,
    resource_type,
    resource_id,
  }, trx) => {
    if(!user) throw new Error(`user must be given to store.role.listForUser`)
    if(!resource_type) throw new Error(`resource_type must be given to store.role.listForUser`)
    if(!resource_id) throw new Error(`resource_id must be given to store.role.listForUser`)

    return (trx || knex).select('*')
      .from(config.TABLES.role)
      .where({
        user: params.user,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
      })
      .first()
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
  const create = ({
    data: {
      user,
      permission,
      resource_type,
      resource_id,
    }
  }, trx) => {
    if(!user) throw new Error(`data.user param must be given to store.role.create`)
    if(!permission) throw new Error(`data.permission param must be given to store.role.create`)
    if(!resource_type) throw new Error(`data.resource_type param must be given to store.role.create`)
    if(!resource_id) throw new Error(`data.resource_id param must be given to store.role.create`)

    return (trx || knex)(config.TABLES.role)
      .insert({
        user,
        permission,
        resource_type,
        resource_id,
      })
      .returning('*')
      .get(0)
  }

  /*
  
    delete a role

    params:

     * id
  
  */
  const del = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.role.delete`)
    return (trx || knex)(config.TABLES.role)
      .where({
        id,
      })
      .del()
      .returning('*')
      .get(0)
  }

  return {
    listForUser,
    listForResource,
    get,
    create,
    delete: del,
  }
}

module.exports = RoleStore