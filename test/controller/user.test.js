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
    password: 'apples',
    role: 'read',
  }

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

  tape('user controller -> check password (incorrect)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: TEST_USER.username,
      password: 'oranges',
    }, (err, result) => {
      t.notok(err, `there was no error`)
      t.notok(result, `the result was correct`)
      t.end()
    })
  })

  tape('user controller -> get', (t) => {

    const controller = getController()

    controller.get({
      username: TEST_USER.username,
    }, (err, user) => {
      t.notok(err, `there was no error`)
      t.equal(user.username, TEST_USER.username, `the result was correct`)
      t.end()
    })
  })

  tape('user controller -> update', (t) => {

    const controller = getController()

    const updateMeta = {
      fruit: 'apples',
    }

    controller.update({
      username: TEST_USER.username,
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

  tape('user controller -> delete', (t) => {

    const controller = getController()

    controller.delete({
      username: TEST_USER.username,
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