'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('../tools')

const database = require('../database')
const fixtures = require('../fixtures')

const UserStore = require('../../src/store/user')

database.testSuiteWithDatabase(getConnection => {

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
      role: 'admin',
      hashed_password: 'na',
    })
  })

  tape('user store -> create with bad role', (t) => {
  
    const store = UserStore(getConnection())
  
    store.create({
      username: 'apples',
      hashed_password: 'na',
      role: 'apples'
    }, (err, user) => {
      t.ok(err, `there was an error`)
      t.end()
    })  
  })
  
  tape('user store -> create users', (t) => {
  
    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      t.deepEqual(users.zebra.meta, {}, `the metadata defaults to empty object`)
      t.end()
    })
  
  })
  
  tape('user store -> list with ordered data', (t) => {
  
    const store = UserStore(getConnection())
  
    store.list({}, (err, users) => {
      t.notok(err, `there was no error`)
      t.equal(users.length, 2, `there were 2 users`)
      t.deepEqual(users.map(user => user.username), [
        'apples',
        'zebra',
      ], 'the users were in the correct order')
      t.end()
    })
    
  })
  
  tape('user store -> get from username then id', (t) => {
  
    const store = UserStore(getConnection())
  
    async.waterfall([
      (next) => store.get({
        username: 'apples',
      }, next),
  
      (usernameUser, next) => {
        t.equal(usernameUser.username, 'apples', `the returned username is correct`)
        store.get({
          id: usernameUser.id,
        }, next)
      },
  
      (idUser, next) => {
        t.equal(idUser.username, 'apples', `the returned username is correct`)
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
      username: 'apples',
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
      username: 'oranges',
    }, (err, user) => {
      t.notok(err, `there was no error`)
      store.list({},(err, users) => {
        t.notok(err, `there was no error`)
        t.equal(users.length, 1, `there is 1 user`)
        t.equal(users[0].username, 'zebra', 'the remaining username is correct')
        t.end()
      })
    })
    
  })
})