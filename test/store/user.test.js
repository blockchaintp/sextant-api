'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('../tools')

const database = require('../database')
const fixtures = require('../fixtures')

const config = require('../../src/config')
const enumerations = require('../../src/enumerations')

const UserStore = require('../../src/store/user')

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}

  tape('user store -> list no data', (t) => {

    const store = UserStore(getConnection())
  
    store.list({}, (err, users) => {
      t.notok(err, `there was no error`)
      t.equal(users.length, 0, `there were no users`)
      t.end()
    })
    
  })

  tape('user store -> create with missing values', (t) => {

    const store = UserStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      username: 'apples',
      permission: 'admin',
      server_side_key: 'na',
      hashed_password: 'na',
    })
  })

  tape('user store -> create with bad role', (t) => {
  
    const store = UserStore(getConnection())
  
    store.create({
      data: {
        username: 'apples',
        hashed_password: 'na',
        server_side_key: 'na',
        permission: 'apples'
      }
    }, (err, user) => {
      t.ok(err, `there was an error`)
      t.end()
    })  
  })
  
  tape('user store -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      t.deepEqual(users.admin.meta, {}, `the metadata defaults to empty object`)
      userMap = users
      t.end()
    })
  
  })
  
  tape('user store -> list with ordered data', (t) => {
  
    const store = UserStore(getConnection())

    const correctOrder = [].concat(enumerations.PERMISSION_USER)
    correctOrder.sort()
  
    store.list({}, (err, users) => {
      t.notok(err, `there was no error`)
      t.equal(users.length, fixtures.SIMPLE_USER_DATA.length, `there were ${fixtures.SIMPLE_USER_DATA.length} users`)
      t.deepEqual(users.map(user => user.username), correctOrder, 'the users were in the correct order')
      t.end()
    })
    
  })
  
  tape('user store -> get from username then id', (t) => {
  
    const store = UserStore(getConnection())
  
    async.waterfall([
      (next) => store.get({
        username: config.PERMISSION_USER.admin,
      }, next),
  
      (usernameUser, next) => {
        t.equal(usernameUser.username, config.PERMISSION_USER.admin, `the returned username is correct`)
        store.get({
          id: usernameUser.id,
        }, next)
      },
  
      (idUser, next) => {
        t.equal(idUser.username, config.PERMISSION_USER.admin, `the returned username is correct`)
        next()
      },
  
    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })
  
  tape('user store -> update user', (t) => {
  
    const store = UserStore(getConnection())
  
    store.update({
      id: userMap[config.PERMISSION_USER.admin].id,
      data: {
        username: 'oranges',
      }
    }, (err, firstUser) => {
      t.notok(err, `there was no error`)
      t.equal(firstUser.username, 'oranges', `the new username is correct`)
      store.get({
        username: 'oranges',
      }, (err, secondUser) => {
        t.notok(err, `there was no error`)
        t.equal(firstUser.id, secondUser.id, `querying on the updated user is working`)
        t.end()
      })
    })
    
  })
  
  tape('user store -> delete user', (t) => {
  
    const store = UserStore(getConnection())
  
    store.delete({
      id: userMap[config.PERMISSION_USER.admin].id,
    }, (err, user) => {
      t.notok(err, `there was no error`)
      store.list({},(err, users) => {
        t.notok(err, `there was no error`)
        t.equal(users.length, fixtures.SIMPLE_USER_DATA.length - 1, `there is 1 less user`)
        t.end()
      })
    })
    
  })
  
})