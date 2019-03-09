const async = require('async')
const config = require('../config')
const utils = require('../utils/user')

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

    count({}, (err, existingUsers) => {
      if(err) return done(err)

      // if there are no current users - force the role to be 'superuser'
      // this is to avoid the initial user being created who cannot then add more users
      const permission = existingUsers == 0 ? config.PERMISSION_USER.superuser : params.permission
      async.parallel({
        hashed_password: (next) => utils.getPasswordHash(params.password, next),
      }, (err, values) => {
        if(err) return done(err)
        store.user.create({
          data: {
            username: params.username,
            permission,
            hashed_password: values.hashed_password,
            server_side_key: utils.getTokenServerSideKey(),
          }
        }, done)
      })
    })
  }

  /*
  
    update a user

    params:

      * id
      * data (all optional)
        * username
        * password
        * role
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
      (next) => {
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
        store.user.update({
          id: params.id,
          data: updateData,
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