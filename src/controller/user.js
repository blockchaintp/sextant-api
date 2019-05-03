const async = require('async')
const config = require('../config')
const utils = require('../utils/user')

const userForms = require('../forms/user')
const validate = require('../forms/validate')

const UserController = ({ store, settings }) => {
  
  if(!settings) throw new Error(`settings required for user controller`)
  if(!settings.tokenSecret) throw new Error(`settings.tokenSecret required for user controller`)
  
  /*
  
    count the number of users

    params:

  */
  const count = (params, done) => {
    store.user.list({}, (err, users) => {
      if(err) return done(err)
      done(null, users.length)
    })
  }

  /*
  
    list the current users

    params:

    returns:

      array[user]

  */
  const list = (params, done) => store.user.list({}, done)

  /*
  
    get a user given the username or id

    params:

     * id - int
    
    one of username of id must be given
    
  */
  const get = (params, done) => {
    if(!params.id && !params.username) return done(`id or username required for controller.user.get`)
    store.user.get({
      username: params.username,
      id: params.id,
    }, done)
  }

  /*
  
    check a user password

    params:

     * username - string
     * password - string
    
  */
  const checkPassword = (params, done) => {
    if(!params.username) return done(`username required for controller.user.checkPassword`)
    if(!params.password) return done(`password required for controller.user.checkPassword`)
    get({
      username: params.username,
    }, (err, user) => {
      if(err) return done(err)
      if(!user) return done(null, false)
      utils.compareHashedPasswords(params.password, user.hashed_password, done)
    })
  }

  /*
  
    add a new user

    params:

     * username - string
     * password - string
     * permission - enumerations.PERMISSION_USER
    
  */
  const create = (params, done) => {

    if(!params.username) return done(`username required for controller.user.create`)
    if(!params.password) return done(`password required for controller.user.create`)
    if(!params.permission) return done(`permission required for controller.user.create`)

    const context = {}
    async.waterfall([

      (next) => count({}, next),

      (existingUsers, next) => {
        context.formData = {
          username: params.username,
          password: params.password,
          permission: existingUsers == 0 ? config.PERMISSION_USER.superuser : params.permission,
        }
        validate({
          schema: userForms.server.add,
          data: context.formData,
        }, next)
      },

      (ok, next) => utils.getPasswordHash(context.formData.password, next),

      (hashed_password, next) => {
        store.user.create({
          data: {
            username: context.formData.username,
            permission: context.formData.permission,
            hashed_password,
            server_side_key: utils.getTokenServerSideKey(),
          }
        }, next)
      },

    ], done)
  }

  /*
  
    update a user

    params:

      * id
      * data (all optional)
        * username
        * password
        * permission
        * meta
    
  */
  const update = (params, done) => {

    if(!params.id) return done(`id must be given to controller.user.update`)
    if(!params.data) return done(`data param must be given to controller.user.update`)

    // check someone is not trying to manually overwrite a users server_side_key
    if(params.data.server_side_key) return done(`access denied`)

    const { 
      id,
      data,
    } = params

    async.waterfall([

      (next) => validate({
        schema: userForms.server.edit,
        data: params.data,
      }, next),
      
      (ok, next) => {
        if(data.password) {
          utils.getPasswordHash(data.password, (err, hashed_password) => {
            if(err) return next(err)
            const updateData = Object.assign({}, data)
            delete(updateData.password)
            updateData.hashed_password = hashed_password
            next(null, updateData)
          })
        }
        else {
          next(null, data)
        }
      },

      (updateData, next) => {

        const sqlData = {
          username: updateData.username,
          hashed_password: updateData.hashed_password,
          permission: updateData.permission,
          meta: updateData.meta,
        }

        const useSqlData = Object.keys(sqlData).reduce((all, field) => {
          if(sqlData[field]) {
            all[field] = sqlData[field]
          }
          return all
        }, {})

        store.user.update({
          id: params.id,
          data: useSqlData,
        }, next)
      },
    ], done)
    
  }

  /*
  
    get a users token

    params:

      * id
    
  */
  const getToken = (params, done) => {

    if(!params.id) return done(`id must be given to controller.user.getToken`)

    async.waterfall([
      (next) => get({
        id: params.id,
      }, next),

      (user, next) => utils.getToken(user.id, user.server_side_key, settings.tokenSecret, next),
        
    ], done)

  }

  /*
  
    update a users token server_side_key

    params:

      * id
    
  */
  const updateToken = (params, done) => {

    if(!params.id) return done(`id must be given to controller.user.updateToken`)

    store.user.update({
      id: params.id,
      data: {
        server_side_key: utils.getTokenServerSideKey()
      },
    }, (err) => {
      if(err) return done(err)
      getToken({
        id: params.id,
      }, done)
    })
  }

  /*
  
    delete a user

    params:

     * id or username
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to controller.user.delete`)
    store.user.delete({
      id: params.id,
    }, done)
  }

  return {
    count,
    list,
    get,
    checkPassword,
    create,
    update,
    getToken,
    updateToken,
    delete: del,
  }

}

module.exports = UserController