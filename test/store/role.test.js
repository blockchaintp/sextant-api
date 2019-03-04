'use strict'

const tape = require('tape')
const async = require('async')
const userUtils = require('../../src/utils/user')
const UserStore = require('../../src/store/user')
const RoleStore = require('../../src/store/role')
const utils = require('../utils')

const databaseName = `testdb${new Date().getTime()}`

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

tape('user store -> create user', (t) => {

  const store = Store(databaseConnection)

  async.eachSeries(SIMPLE_USER_DATA, (userData, nextUser) => {
    getTestUserData(userData, (err, data) => {
      if(err) return nextUser(err)
      store.create(data, nextUser)
    })
  }, (err) => {
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
