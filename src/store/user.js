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
    if(!params.username) return done(`username param must be given to store.user.add`)
    if(!params.hashed_password) return done(`hashed_password param must be given to store.user.add`)
    if(!params.role) return done(`role param must be given to store.user.add`)
    knex('user')
      .insert(params)
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

    const query = {}
    if(params.id) query.id = params.id
    if(params.username) query.username = params.username

    knex('user')
      .where(query)
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
      .where(params)
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