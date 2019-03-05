'use strict'

const async = require('async')
const userUtils = require('../src/utils/user')
const UserStore = require('../src/store/user')

const SIMPLE_USER_DATA = [{
  username: 'zebra',
  password: 'zebra1',
  role: 'admin',
},{
  username: 'apples',
  password: 'apples1',
  role: 'write',
}]

const getTestUserData = (data, done) => {
  userUtils.getPasswordHash(data.password, (err, hashed_password) => {
    if(err) return done(err)
    const userData = {
      username: data.username,
      role: data.role,
      hashed_password,
    }
    done(null, userData)
  })
}

const insertTestUsers = (databaseConnection, done) => {
  const store = UserStore(databaseConnection)

  // map of usernames onto database records
  const userMap = {}

  async.eachSeries(SIMPLE_USER_DATA, (userData, nextUser) => {
    getTestUserData(userData, (err, data) => {
      if(err) return nextUser(err)
      store.create(data, (err, user) => {
        if(err) return nextUser(err)
        userMap[user.username] = user
        nextUser()
      })
    })
  }, (err) => {
    if(err) return done(err)
    done(null, userMap)
  })
}

module.exports = {
  SIMPLE_USER_DATA,
  getTestUserData,
  insertTestUsers,
}