const config = require('../config')
const databaseTools = require('../utils/database')

const UserStore = (knex) => {

  /*
  
    list all users

    params:
  
  */
  const list = (params, done) => {

    const orderBy = config.LIST_ORDER_BY_FIELDS.user

    knex.select('*')
      .from(config.TABLES.user)
      .orderBy(orderBy.field, orderBy.direction)
      .asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    get a single user

    params:

      * id or username
    
    one of id or username must be given
  
  */
  const get = (params, done) => {
    if(!params.id && !params.username) return done(`one of id or username must be given to store.user.get`)

    const query = {}
    if(params.id) query.id = params.id
    if(params.username) query.username = params.username
    
    knex.select('*')
      .from(config.TABLES.user)
      .where(query)
      .asCallback(databaseTools.singleExtractor(done))
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
      
      * transaction - used if present
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.user.create`)
    if(!params.data.username) return done(`data.username param must be given to store.user.create`)
    if(!params.data.hashed_password) return done(`data.hashed_password param must be given to store.user.create`)
    if(!params.data.server_side_key) return done(`data.server_side_key param must be given to store.user.create`)
    if(!params.data.permission) return done(`data.permission param must be given to store.user.create`)

    const insertData = {
      username: params.data.username,
      hashed_password: params.data.hashed_password,
      server_side_key: params.data.server_side_key,
      permission: params.data.permission,
      meta: params.data.meta,
    }

    const query = knex(config.TABLES.user)
      .insert(insertData)
      .returning('*')
    
    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
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
      
      * transaction - used if present
    
    one of id or username must be given
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.user.update`)
    if(!params.data) return done(`data param must be given to store.user.update`)

    const query = knex(config.TABLES.user)
      .where({
        id: params.id,
      })
      .update(params.data)
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single user

    params:

      * id

      * transaction - used if present
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.user.delete`)

    const query = knex(config.TABLES.user)
      .where({
        id: params.id,
      })
      .del()
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
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