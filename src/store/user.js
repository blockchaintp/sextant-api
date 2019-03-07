const databaseTools = require('../utils/database')

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

    const query = {}
    if(params.id) query.id = params.id
    if(params.username) query.username = params.username
    
    knex.select('*')
      .from('user')
      .where(query)
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
    if(!params.token) return done(`token param must be given to store.user.create`)
    if(!params.token_salt) return done(`token_salt param must be given to store.user.create`)
    if(!params.role) return done(`role param must be given to store.user.create`)

    const insertData = {
      username: params.username,
      hashed_password: params.hashed_password,
      token: params.token,
      token_salt: params.token_salt,
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

      * id
      * data (all optional)
        * username
        * hashed_password
        * role
        * meta
    
    one of id or username must be given
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.user.update`)
    if(!params.data) return done(`data param must be given to store.user.update`)

    knex('user')
      .where({
        id: params.id,
      })
      .update(params.data)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a single user

    params:

      * id
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.user.delete`)

    knex('user')
      .where({
        id: params.id,
      })
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