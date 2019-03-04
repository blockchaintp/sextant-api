'use strict'

const tape = require('tape')
const async = require('async')
const Store = require('../../src/store/user')
const utils = require('../utils')

const userFixtures = require('./fixtures/user')

const databaseName = `testdb${new Date().getTime()}`

let databaseConnection = null

tape('user store -> setup database', (t) => {

  utils.createTestKnex(databaseName, (err, knex) => {
    t.notok(err, `there was no error`)
    databaseConnection = knex
    t.end()
  })

})

tape('user store -> list no data', (t) => {

  const store = Store(databaseConnection)

  store.list({}, (err, users) => {
    t.notok(err, `there was no error`)
    t.equal(users.length, 0, `there were no users`)
    t.end()
  })
  
})

tape('user store -> insert with no hashed password', (t) => {

  const store = Store(databaseConnection)

  store.create({
    username: 'apples',
    role: 'admin'
  }, (err, user) => {
    t.ok(err, `there was an error`)
    t.end()
  })  
})

tape('user store -> insert with no role', (t) => {

  const store = Store(databaseConnection)

  store.create({
    username: 'apples',
    hashed_password: 'na',
  }, (err, user) => {
    t.ok(err, `there was an error`)
    t.end()
  })  
})

tape('user store -> insert with bad role', (t) => {

  const store = Store(databaseConnection)

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

  userFixtures.insertTestUsers(databaseConnection, (err) => {
    t.notok(err, `there was no error`)
    t.end()
  })

})

tape('user store -> list with ordered data', (t) => {

  const store = Store(databaseConnection)

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

  const store = Store(databaseConnection)

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

  const store = Store(databaseConnection)

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

tape('mock user store -> delete user', (t) => {

  const store = Store(databaseConnection)

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

tape('user store -> teardown database', (t) => {

  databaseConnection
    .destroy()
    .then(() => {
      utils.destroyTestKnex(databaseName, (err, knex) => {
        t.notok(err, `there was no error`)
        t.end()
      })
    })
    .catch(err => {
      t.error(err)
      t.end()
    })
})
