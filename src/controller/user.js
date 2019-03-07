const async = require('async')
const utils = require('../utils/user')

const UserController = ({ store }) => {
  
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
     * role - {admin,user}
    
  */
  const create = (params, done) => {

    if(!params.username) return done(`username required for controller.user.create`)
    if(!params.password) return done(`password required for controller.user.create`)
    if(!params.role) return done(`role required for controller.user.create`)

    count({}, (err, existingUsers) => {
      if(err) return done(err)

      // if there are no current users - force the role to be 'admin'
      // this is to avoid the initial user being created who cannot then add more users
      const role = existingUsers == 0 ? 'admin' : params.role

      utils.getPasswordHash(params.password, (err, hashed_password) => {
        if(err) return done(err)
        store.user.create({
          username: params.username,
          hashed_password,
          role,
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
    delete: del,
  }

}

module.exports = UserController