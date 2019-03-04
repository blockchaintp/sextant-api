const databaseTools = require('../utils/database')

const RoleStore = (knex) => {

  /*
  
    list all roles for a given user

    params:

      * user
  
  */

  const list = (params, done) => {
    if(!params.user) return done(`user must be given to store.role.list`)

    knex.select('*')
      .from('role')
      .where({
        user: params.user,
      })
      .asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    get a single role for a user on a certain resource

    params:

      * user
      * resource_type
      * resource_id
  
  */

 const get = (params, done) => {
  if(!params.user) return done(`user must be given to store.role.listForUser`)
  if(!params.resource_type) return done(`resource_type must be given to store.role.listForUser`)
  if(!params.resource_id) return done(`resource_id must be given to store.role.listForUser`)

  knex.select('*')
    .from('role')
    .where({
      user: params.user,
    })
    .asCallback(databaseTools.allExtractor(done))
}

  /*
  
    insert a new role

    params:

      * user
      * permission
      * resource_type
      * resource_id
  
  */
  const create = (params, done) => {
    if(!params.user) return done(`user param must be given to store.role.add`)
    if(!params.permission) return done(`permission param must be given to store.role.add`)
    if(!params.resource_type) return done(`resource_type param must be given to store.role.add`)
    if(!params.resource_id) return done(`resource_id param must be given to store.role.add`)
    knex('role')
      .insert(params)
      .returning('*')
      .asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a role

    params:

     * id
  
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.role.delete`)
    knex('role')
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
    add,
    update,
    delete: del,
  }
}

module.exports = RoleStore