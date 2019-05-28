const config = require('../config')

const UserStore = (knex) => {

  /*
  
    list all users

    params:

  */
  const list = ({}, trx) => {

    const orderBy = config.LIST_ORDER_BY_FIELDS.user

    return (trx || knex).select('*')
      .from(config.TABLES.user)
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*
  
    get a single user

    params:

      * id or username

      * transaction - used if present
    
    one of id or username must be given
  
  */
  const get = ({
    id,
    username,
  }, trx) => {
    if(!id && !username) throw new Error(`one of id or username must be given to store.user.get`)

    const query = {}
    if(id) query.id = id
    if(username) query.username = username
    
    return (trx || knex).select('*')
      .from(config.TABLES.user)
      .where(query)
      .first()
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
  const create = ({
    data: {
      username,
      hashed_password,
      server_side_key,
      permission,
      meta,
    }
  }, trx) => {
    if(!username) throw new Error(`data.username param must be given to store.user.create`)
    if(!hashed_password) throw new Error(`data.hashed_password param must be given to store.user.create`)
    if(!server_side_key) throw new Error(`data.server_side_key param must be given to store.user.create`)
    if(!permission) throw new Error(`data.permission param must be given to store.user.create`)

    return (trx || knex)(config.TABLES.user)
      .insert({
        username,
        hashed_password,
        server_side_key,
        permission,
        meta,
      })
      .returning('*')
      .get(0)
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
  const update = ({
    id,
    data,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.user.update`)
    if(!data) throw new Error(`data param must be given to store.user.update`)

    return (trx || knex)(config.TABLES.user)
      .where({
        id,
      })
      .update(data)
      .returning('*')
      .get(0)
  }

  /*
  
    delete a single user

    params:

      * id
    
  */
  const del = ({
    id,
  }, trx) => {
    if(!id) throw new Error(`id must be given to store.user.delete`)

    return (trx || knex)(config.TABLES.user)
      .where({
        id,
      })
      .del()
      .returning('*')
      .get(0)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
  }
}

module.exports = UserStore