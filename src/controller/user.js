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

     * username - string
     * id - int
    
    one of username of id must be given
    
  */
  const get = (params, done) => {
    if(!params.username && !params.id) return done(`id or username required for controller.user.get`)
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
    
    utils.getPasswordHash(params.username, (err, hashed_password) => {
      if(err) return done(err)
      store.user.create({
        username: params.username,
        hashed_password,
        role: params.role,
      }, done)
    })
    
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
    
  */
  const update = (params, done) => {

    if(!params.id && !params.username) return done(`one of id or username must be given to controller.user.update`)
    if(!params.data) return done(`data param must be given to controller.user.update`)

    store.user.update({
      id: params.id,
      username: params.username,
      data: params.data,
    }, done)
  }

  /*
  
    delete a user

    params:

     * id or username
    
  */
  const del = (params, done) => {
    if(!params.id && !params.username) return done(`one of id or username must be given to controller.user.delete`)
    store.user.delete({
      username: params.username,
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