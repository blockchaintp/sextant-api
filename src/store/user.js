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

     * id
     * username
    
    one of id or username must be given
  
  */
  const get = (params, done) => {
    if(!params.id && !params.username) return done(`one of id or username must be given to store.user.get`)
    knex.select('*')
      .from('user')
      .where({
        params
      })
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    insert a new user

    params:

     * data
  
  */
  const add = (params, done) => {
    if(!params.data) return done(`data param must be given to store.user.add`)
    knex('user')
      .insert(params.data)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    update a user

    params:

     * id
     * username
     * data
    
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

     * id
     * username
    
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
    add,
    update,
    delete: del,
  }
}

module.exports = UserStore