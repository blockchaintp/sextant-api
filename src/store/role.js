const config = require('../config')
const databaseTools = require('../utils/database')

const RoleStore = (knex) => {

  /*
  
    list all roles for a given user

    params:

      * user
  
      * transaction - used if present
  */

  const listForUser = (params, done) => {
    if(!params.user) return done(`user must be given to store.role.listForUser`)

    const sqlQuery = knex.select('*')
      .from(config.TABLES.role)
      .where({
        user: params.user,
      })

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    list all roles for a given resource

    params:

      * resource_type
      * resource_id
  
      * transaction - used if present
  */

  const listForResource = (params, done) => {
    if(!params.resource_type) return done(`resource_type must be given to store.role.listForResource`)
    if(!params.resource_id) return done(`resource_type must be given to store.role.listForResource`)

    const sqlQuery = knex.select('*')
      .from(config.TABLES.role)
      .where({
        resource_type: params.resource_type,
        resource_id: params.resource_id,
      })

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.allExtractor(done))
  }

  /*
  
    get a single role for a user on a certain resource

    params:

      * user
      * resource_type
      * resource_id
  
      * transaction - used if present
  */

  const get = (params, done) => {
    if(!params.user) return done(`user must be given to store.role.listForUser`)
    if(!params.resource_type) return done(`resource_type must be given to store.role.listForUser`)
    if(!params.resource_id) return done(`resource_id must be given to store.role.listForUser`)

    const sqlQuery = knex.select('*')
      .from(config.TABLES.role)
      .where({
        user: params.user,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
      })

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }

    sqlQuery.asCallback(databaseTools.singleExtractor(done))
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
    if(!params.data) return done(`data param must be given to store.role.create`)
    if(!params.data.user) return done(`data.user param must be given to store.role.create`)
    if(!params.data.permission) return done(`data.permission param must be given to store.role.create`)
    if(!params.data.resource_type) return done(`data.resource_type param must be given to store.role.create`)
    if(!params.data.resource_id) return done(`data.resource_id param must be given to store.role.create`)

    const sqlQuery = knex(config.TABLES.role)
      .insert({
        user: params.data.user,
        permission: params.data.permission,
        resource_type: params.data.resource_type,
        resource_id: params.data.resource_id,
      })
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.singleExtractor(done))
  }

  /*
  
    delete a role

    params:

     * id

     * transaction - used if present
  
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to store.role.delete`)
    const sqlQuery = knex(config.TABLES.role)
      .where({
        id: params.id,
      })
      .del()
      .returning('*')

    if(params.transaction) {
      sqlQuery.transacting(params.transaction)
    }
    
    sqlQuery.asCallback(databaseTools.singleExtractor(done))
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