const config = require('../config')
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
      .from(config.TABLES.role)
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
    .from(config.TABLES.role)
    .where({
      user: params.user,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
    })
    .asCallback(databaseTools.singleExtractor(done))
}

  /*
  
    insert a new role

    params:

      * data
        * user
        * permission
        * resource_type
        * resource_id
      
      * transaction - used if present
  
  */
  const create = (params, done) => {
    if(!params.data) return done(`data param must be given to store.role.add`)
    if(!params.data.user) return done(`data.user param must be given to store.role.add`)
    if(!params.data.permission) return done(`data.permission param must be given to store.role.add`)
    if(!params.data.resource_type) return done(`data.resource_type param must be given to store.role.add`)
    if(!params.data.resource_id) return done(`data.resource_id param must be given to store.role.add`)

    const query = knex(config.TABLES.role)
      .insert({
        user: params.data.user,
        permission: params.data.permission,
        resource_type: params.data.resource_type,
        resource_id: params.data.resource_id,
      })
      .returning('*')

    if(params.transaction) {
      query.transacting(params.transaction)
    }
    
    query.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a role

    params:

     * id

     * transaction - used if present
  
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.role.delete`)
    const query = knex(config.TABLES.role)
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
    delete: del,
  }
}

module.exports = RoleStore