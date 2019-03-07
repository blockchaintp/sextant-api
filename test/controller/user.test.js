'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('../tools')

const database = require('../database')
const fixtures = require('../fixtures')

const UserController = require('../../src/controller/user')
const Store = require('../../src/store')

database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return UserController({store})
  }

  const TEST_USER = {
    username: 'apples',
    password: 'oranges',
    role: 'read',
  }

  let TEST_USER_RECORD = null

  tape('user controller -> list no data', (t) => {

    const controller = getController()
    
    controller.list({}, (err, users) => {
      t.notok(err, `there was no error`)
      t.equal(users.length, 0, `there were no users`)
      t.end()
    })
    
  })

  tape('user controller -> count no data', (t) => {

    const controller = getController()

    controller.count({}, (err, count) => {
      t.notok(err, `there was no error`)
      t.equal(count, 0, `there were no users`)
      t.end()
    })
  })

  tape('user controller -> create', (t) => {
  
    const controller = getController()
  
    controller.create(TEST_USER, (err, user) => {
      t.notok(err, `there was no error`)
      t.equal(user.username, TEST_USER.username)

      // make sure the role is forced to admin as the initial user
      t.equal(user.role, 'admin')

      TEST_USER_RECORD = user
      t.end()
    })
  })
  
  
  tape('user controller -> check password (correct)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: TEST_USER.username,
      password: TEST_USER.password,
    }, (err, result) => {
      t.notok(err, `there was no error`)
      t.ok(result, `the result was correct`)
      t.end()
    })
  })

  tape('user controller -> check password (wrong user)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: 'baduser',
      password: TEST_USER.password,
    }, (err, result) => {
      t.notok(err, `there was no error`)
      t.notok(result, `the result was correct`)
      t.end()
    })
  })

  tape('user controller -> check password (incorrect)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: TEST_USER.username,
      password: 'badpassword',
    }, (err, result) => {
      t.notok(err, `there was no error`)
      t.notok(result, `the result was correct`)
      t.end()
    })
  })

  tape('user controller -> get', (t) => {

    const controller = getController()

    controller.get({
      id: TEST_USER_RECORD.id,
    }, (err, user) => {
      t.notok(err, `there was no error`)
      t.equal(user.username, TEST_USER.username, `the result was correct`)
      t.end()
    })
  })

  tape('user controller -> update meta', (t) => {

    const controller = getController()

    const updateMeta = {
      fruit: 'apples',
    }

    controller.update({
      id: TEST_USER_RECORD.id,
      data: {
        meta: updateMeta,
      }
    }, (err) => {
      t.notok(err, `there was no error`)
      controller.get({
        username: TEST_USER.username,
      }, (err, user) => {
        t.notok(err, `there was no error`)
        t.deepEqual(user.meta, updateMeta, `the metadata update was correct`)
        t.end()
      })
    })
  })

  tape('user controller -> update password', (t) => {

    const controller = getController()

    controller.update({
      id: TEST_USER_RECORD.id,
      data: {
        password: 'newpassword',
      }
    }, (err) => {
      t.notok(err, `there was no error`)
      controller.checkPassword({
        username: TEST_USER_RECORD.username,
        password: 'newpassword',
      }, (err, result) => {
        t.notok(err, `there was no error`)
        t.ok(result, `the result was correct`)
        t.end()
      })
    })
  })

  tape('user controller -> delete', (t) => {

    const controller = getController()

    controller.delete({
      id: TEST_USER_RECORD.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      controller.count({}, (err, count) => {
        t.notok(err, `there was no error`)
        t.equal(count, 0, `there were no users`)
        t.end()
      })
    })
  })
  
})