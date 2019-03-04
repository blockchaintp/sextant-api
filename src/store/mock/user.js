const sortUsernames = (a,b) => {
  if (a.username < b.username)
    return -1;
  if (a.username > b.username)
    return 1;
  return 0;
}

const getUserIdFromUsername = (data, username) => {
  const id = Object.keys(data).filter(id => data[id].username = username)[0]
  if(!id) return null
  return id
}

const MockUserStore = (data) => {

  data = data || {}

  const highestId = Object.keys(data).reduce((highest, id) => {
    const user = data[id]
    return user.id > highest ? user.id : highest
  }, 0)

  /*
  
    list all users

    params:
  
  */
  const list = (params, done) => {
    const users = Object.keys(data).reduce((all, id) => {
      all = all.concat(data[id])
      return all
    }, [])
    return done(null, users.sort(sortUsernames))
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
    const id = params.id || getUserIdFromUsername(data, params.username)
    done(null, data[id])
  }

  /*
  
    insert a new user

    params:

     * data
  
  */
  const add = (params, done) => {
    if(!params.data) return done(`data param must be given to store.user.add`)
    const newId = highestId + 1
    const userRecord = Object.assign({}, params.data, {
      id: newId,
      created_at: new Date(),
    })
    data[newId] = userRecord
    done(null, userRecord)
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
    const id = params.id || getUserIdFromUsername(data, params.username)
    const user = data[id]
    if(!user) return done(`no user found`)
    const newRecord = Object.assign({}, user, params.data)
    newRecord.id = user.id
    data[user.id] = newRecord
    done(null, newRecord)
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
    const id = params.id || getUserIdFromUsername(data, params.username)
    const user = data[id]
    if(!user) return done(`no user found`)
    delete(data[id])
    done(null, user)
  }

  return {
    list,
    get,
    add,
    update,
    delete: del,
  }
}

module.exports = MockUserStore