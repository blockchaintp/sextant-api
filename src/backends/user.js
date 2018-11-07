const pino = require('pino')({
  name: 'backend.users',
})

const UsersBackend = ({ store, jobDispatcher }) => {
  
  /*
  
    count the number of users

    params:

  */
  const count = (params, done) => {
    store.listUsers({}, (err, users) => {
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
  const list = (params, done) => store.listUsers({}, done)

  /*
  
    get a user given the username

    params:

     * username - string
    
  */
  const get = (params, done) => {
    store.getUser({
      username: params.username,
    }, done)
  }

  /*
  
    check a user password

    params:

     * username - string
     * password - string
    
  */
  const checkPassword = (params, done) => {
    store.checkUserPassword({
      username: params.username,
      password: params.password,
    }, done)
  }

  /*
  
    add a new user

    params:

     * username - string
     * password - string
     * type - string
    
  */
  const add = (params, done) => {
    store.addUser({
      username: params.username,
      password: params.password,
      type: params.type,
    }, done)
  }

  /*
  
    update a user

    params:

     * existingUsername - string
     * username - string
     * password - string
     * type - string
    
  */
  const update = (params, done) => {
    store.updateUser({
      existingUsername: params.existingUsername,
      username: params.username,
      password: params.password,
      type: params.type,
    }, done)
  }

  /*
  
    delete a user

    params:

     * username - string
    
  */
  const del = (params, done) => {
    store.deleteUser({
      username: params.username,
    }, done)
  }

  return {
    count,
    list,
    get,
    checkPassword,
    add,
    update,
    del,
  }

}

module.exports = UsersBackend