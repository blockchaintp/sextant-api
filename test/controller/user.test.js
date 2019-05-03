'use strict'

const tape = require('tape')
const async = require('async')
const database = require('../database')
const UserController = require('../../src/controller/user')
const Store = require('../../src/store')
const userUtils = require('../../src/utils/user')
const config = require('../../src/config')
const tools = require('../tools')

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
    
    controller.list({}, tools.errorWrapper(t, (users) => {
      t.equal(users.length, 0, `there were no users`)
      t.end()
    }))
    
  })

  tape('user controller -> count no data', (t) => {

    const controller = getController()

    controller.count({}, tools.errorWrapper(t, (count) => {
      t.equal(count, 0, `there were no users`)
      t.end()
    }))
  })

  tape('user controller -> create', (t) => {
  
    const controller = getController()
  
    controller.create(TEST_USER, tools.errorWrapper(t, (user) => {
      t.equal(user.username, TEST_USER.username)

      // make sure the permission is forced to superuser as the initial user
      t.equal(user.permission, PERMISSION_USER.superuser)
      t.ok(user.hashed_password, 'there is a hashed password')
      t.ok(user.server_side_key, 'there is a server_side_key')

      TEST_USER_RECORD = user
      t.end()
    }))
  })
  
  
  tape('user controller -> check password (correct)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: TEST_USER.username,
      password: TEST_USER.password,
    }, tools.errorWrapper(t, (result) => {
      t.ok(result, `the result was correct`)
      t.end()
    }))
  })

  tape('user controller -> check password (wrong user)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: 'baduser',
      password: TEST_USER.password,
    }, tools.errorWrapper(t, (result) => {
      t.notok(result, `the result was correct`)
      t.end()
    }))
  })

  tape('user controller -> check password (incorrect)', (t) => {

    const controller = getController()

    controller.checkPassword({
      username: TEST_USER.username,
      password: 'badpassword',
    }, tools.errorWrapper(t, (result) => {
      t.notok(result, `the result was correct`)
      t.end()
    }))
  })

  tape('user controller -> get', (t) => {

    const controller = getController()

    controller.get({
      id: TEST_USER_RECORD.id,
    }, tools.errorWrapper(t, (user) => {
      t.equal(user.username, TEST_USER.username, `the result was correct`)
      t.equal(user.hashed_password, TEST_USER_RECORD.hashed_password, 'there is a hashed password')
      t.equal(user.server_side_key, TEST_USER_RECORD.server_side_key, 'there is a server_side_key')
      t.end()
    }))
  })

  tape('user controller -> update meta', (t) => {

    const controller = getController()

    const updateMeta = {
      fruit: 'apples',
    }

    async.series([
      next => controller.update({
        id: TEST_USER_RECORD.id,
        data: {
          meta: updateMeta,
        }
      }, next),

      next => controller.get({
        username: TEST_USER.username,
      }, (err, user) => {
        if(err) return next(err)
        t.deepEqual(user.meta, updateMeta, `the metadata update was correct`)
        next()
      }),

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })

  })

  tape('user controller -> update password', (t) => {

    const controller = getController()

    async.series([
      next => controller.update({
        id: TEST_USER_RECORD.id,
        data: {
          password: 'newpassword',
        }
      }, next),

      next => controller.checkPassword({
        username: TEST_USER_RECORD.username,
        password: 'newpassword',
      }, (err, result) => {
        if(err) return next(err)
        t.ok(result, `the result was correct`)
        next()
      }),

    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
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

    async.waterfall([
      (next) => async.parallel({
        token: nextp => controller.getToken({
          id: TEST_USER_RECORD.id,
        }, nextp),
        user: nextp => controller.get({
          id: TEST_USER_RECORD.id,
        }, nextp),
      }, next),

      (results, next) => {
        const {
          token,
          user,
        } = results
        userUtils.decodeToken(token, config.tokenSecret, (err, decoded) => {
          if(err) return next(err)
          t.equal(decoded.id, user.id, `the id in the token is correct`)
          t.equal(decoded.server_side_key, user.server_side_key, `the server_side_key in the token is correct`)
          next()
        })
      },
    ], (err) => {
      t.notOk(err, `there was no error`)
      t.end()
    })
  })

  tape('user controller -> update token', (t) => {

    const controller = getController()

    async.series([
      next => controller.updateToken({
        id: TEST_USER_RECORD.id,
      }, next),

      next => {
        controller.get({
          id: TEST_USER_RECORD.id,
        }, (err, result) => {
          if(err) return next(err)
          t.notEqual(result.server_side_key, TEST_USER_RECORD.server_side_key, 'the server_side_key is now different')
          next()
        })
      }
    ], (err) => {
      t.notOk(err, `there was no error`)
      t.end()
    })
  })

  tape('user controller -> delete', (t) => {

    const controller = getController()

    async.series([

      next => controller.delete({
        id: TEST_USER_RECORD.id,
      }, next),

      next => controller.count({}, (err, count) => {
        if(err) return next(err)
        t.equal(count, 0, `there were no users`)
        next()
      })
    ], (err) => {
      t.notOk(err, `there was no error`)
      t.end()
    })

  })
  
})