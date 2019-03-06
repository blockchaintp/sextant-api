const databaseTools = require('../utils/database')

const getIdOrUsernameQuery = (params) => {
  const query = {}
  if(params.id) query.id = params.id
  if(params.username) query.username = params.username
  return query
}

const UserStore = (knex) => {

  /*
  
    list all users

    params:
  
  */
  const list = (params, done) => {
    knex.select('*')
      .from('user')
      .orderBy('username')
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

    knex.select('*')
      .from('user')
      .where(getIdOrUsernameQuery(params))
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new user

    params:

      * username
      * hashed_password
      * role
      * meta
  */
  const create = (params, done) => {
    if(!params.username) return done(`username param must be given to store.user.create`)
    if(!params.hashed_password) return done(`hashed_password param must be given to store.user.create`)
    if(!params.role) return done(`role param must be given to store.user.create`)

    const insertData = {
      username: params.username,
      hashed_password: params.hashed_password,
      role: params.role,
      meta: params.meta,
    }

    knex('user')
      .insert(insertData)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a user

    params:

      * id or username
      * data (all optional)
        * username
        * hashed_password
        * role
        * meta
    
    one of id or username must be given
  
  */
  const update = (params, done) => {
    if(!params.id && !params.username) return done(`one of id or username must be given to store.user.update`)
    if(!params.data) return done(`data param must be given to store.user.update`)

    knex('user')
      .where(getIdOrUsernameQuery(params))
      .update(params.data)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single user

    params:

      * id or username
    
    one of id or username must be given
  
  */
  const del = (params, done) => {
    if(!params.id && !params.username) return done(`one of id or username must be given to store.user.delete`)

    knex('user')
      .where(getIdOrUsernameQuery(params))
      .del()
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
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