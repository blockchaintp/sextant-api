'use strict'

const tape = require('tape')
const database = require('../database')
const UserController = require('../../src/controller/user')
const Store = require('../../src/store')
const userUtils = require('../../src/utils/user')
const config = require('../../src/config')

const {
  PERMISSION_USER,
} = config

database.testSuiteWithDatabase(getConnection => {

  const getController = () => {
    const store = Store(getConnection())
    return UserController({
      store,
      settings: {
        tokenSecret: config.tokenSecret,
      }
    })
  }

  const TEST_USER = {
    username: 'apples',
    password: 'oranges',
    permission: PERMISSION_USER.user,
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

      // make sure the permission is forced to superuser as the initial user
      t.equal(user.permission, PERMISSION_USER.superuser)
      t.ok(user.hashed_password, 'there is a hashed password')
      t.ok(user.server_side_key, 'there is a server_side_key')

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
      t.equal(user.hashed_password, TEST_USER_RECORD.hashed_password, 'there is a hashed password')
      t.equal(user.server_side_key, TEST_USER_RECORD.server_side_key, 'there is a server_side_key')
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

  tape('user controller -> attempt update token via normal update handler', (t) => {

    const controller = getController()

    controller.update({
      id: TEST_USER_RECORD.id,
      data: {
        server_side_key: 'notallowed',
      }
    }, (err) => {
      t.ok(err, `there was an error`)
      t.equal(err, `access denied`, `error message is correct`)
      t.end()
    })
  })

  tape('user controller -> get token', (t) => {

    const controller = getController()

    controller.getToken({
      id: TEST_USER_RECORD.id,
    }, (err, token) => {
      t.notok(err, `there was no error`)
      controller.get({
        id: TEST_USER_RECORD.id,
      }, (err, user) => {
        t.notok(err, `there was no error`)

        userUtils.decodeToken(token, config.tokenSecret, (err, decoded) => {
          t.notok(err, `there was no error`)

          t.equal(decoded.id, user.id, `the id in the token is correct`)
          t.equal(decoded.server_side_key, user.server_side_key, `the server_side_key in the token is correct`)
          t.end()
        })
        
      })
    })
  })

  tape('user controller -> update token', (t) => {

    const controller = getController()

    controller.updateToken({
      id: TEST_USER_RECORD.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      controller.get({
        id: TEST_USER_RECORD.id,
      }, (err, result) => {
        t.notok(err, `there was no error`)
        t.notEqual(result.server_side_key, TEST_USER_RECORD.server_side_key, 'the server_side_key is now different')
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