const databaseTools = require('../utils/database')

const UserStore = (knex) => {

  /*
  
    list all users

    params:
  
  */
  const list = (params, done) => {
    knex.select('*')
      .from('useraccount')
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
      .from('useraccount')
      .where(query)
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new user

    params:

      * data
        * username
        * hashed_password
        * role
        * meta
      
      * transaction - used if present
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.user.create`)
    if(!params.data.username) return done(`data.username param must be given to store.user.create`)
    if(!params.data.hashed_password) return done(`data.hashed_password param must be given to store.user.create`)
    if(!params.data.token) return done(`data.token param must be given to store.user.create`)
    if(!params.data.token_salt) return done(`data.token_salt param must be given to store.user.create`)
    if(!params.data.role) return done(`data.role param must be given to store.user.create`)

    const insertData = {
      username: params.data.username,
      hashed_password: params.data.hashed_password,
      token: params.data.token,
      token_salt: params.data.token_salt,
      role: params.data.role,
      meta: params.data.meta,
    }

    const query = knex('useraccount')
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
        * role
        * meta
      
      * transaction - used if present
    
    one of id or username must be given
  
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to store.user.update`)
    if(!params.data) return done(`data param must be given to store.user.update`)

    const query = knex('useraccount')
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

    const query = knex('useraccount')
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