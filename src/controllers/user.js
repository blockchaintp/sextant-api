const UsersBackend = ({ store }) => {
  
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
  
    get a user given the username

    params:

     * username - string
    
  */
  const get = (params, done) => {
    store.user.get({
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

    // do this here not in the store
    
    /*store.users.checkPassword({
      username: params.username,
      password: params.password,
    }, done)
    */
  }

  /*
  
    add a new user

    params:

     * username - string
     * password - string
     * role - {admin,user}
    
  */
  const add = (params, done) => {
    store.user.add({
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
    store.user.update({
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
    store.user.delete({
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