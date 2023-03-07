/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-var-requires */
'use strict'

const asyncTest = require('../asyncTest')
const database = require('../database')
const UserController = require('../../src/controller/user')
const { Store } = require('../../src/store')
const userUtils = require('../../src/utils/user')
const config = require('../../src/config')

const { USER_TYPES } = config

database.testSuiteWithDatabase((getConnection) => {
  const getController = () => {
    const store = new Store(getConnection())
    return UserController({
      store,
      settings: {
        tokenSecret: config.tokenSecret,
      },
    })
  }

  const TEST_USER = {
    username: 'apples',
    password: 'oranges',
    permission: USER_TYPES.user,
  }

  let TEST_USER_RECORD = null

  asyncTest('user controller -> list no data', async (t) => {
    const controller = getController()

    const users = await controller.list({})
    t.equal(users.length, 0, `there were no users`)
  })

  asyncTest('user controller -> count no data', async (t) => {
    const controller = getController()

    const count = await controller.count({})
    t.equal(count, 0, `there were no users`)
  })

  asyncTest('user controller -> create', async (t) => {
    const controller = getController()

    const user = await controller.create(TEST_USER)
    t.equal(user.username, TEST_USER.username)

    // make sure the permission is forced to superuser as the initial user
    t.equal(user.permission, USER_TYPES.superuser)
    t.ok(user.hashed_password, 'there is a hashed password')
    t.ok(user.server_side_key, 'there is a server_side_key')

    TEST_USER_RECORD = user
  })

  asyncTest('user controller -> check password (correct)', async (t) => {
    const controller = getController()

    const result = await controller.checkPassword({
      username: TEST_USER.username,
      password: TEST_USER.password,
    })
    t.ok(result, `the result was correct`)
  })

  asyncTest('user controller -> check password (wrong user)', async (t) => {
    const controller = getController()

    const result = await controller.checkPassword({
      username: 'baduser',
      password: TEST_USER.password,
    })
    t.notok(result, `the result was correct`)
  })

  asyncTest('user controller -> check password (incorrect)', async (t) => {
    const controller = getController()

    const result = await controller.checkPassword({
      username: TEST_USER.username,
      password: 'badpassword',
    })
    t.notok(result, `the result was correct`)
  })

  asyncTest('user controller -> get', async (t) => {
    const controller = getController()

    const user = await controller.get({
      id: TEST_USER_RECORD.id,
    })
    t.equal(user.username, TEST_USER.username, `the result was correct`)
    t.equal(user.hashed_password, TEST_USER_RECORD.hashed_password, 'there is a hashed password')
    t.equal(user.server_side_key, TEST_USER_RECORD.server_side_key, 'there is a server_side_key')
  })

  asyncTest('user controller -> update meta', async (t) => {
    const controller = getController()

    const updateMeta = {
      fruit: 'apples',
    }

    await controller.update({
      id: TEST_USER_RECORD.id,
      data: {
        meta: updateMeta,
      },
    })

    const user = await controller.get({
      username: TEST_USER.username,
    })

    t.deepEqual(user.meta, updateMeta, `the metadata update was correct`)
  })

  asyncTest('user controller -> update password', async (t) => {
    const controller = getController()

    await controller.update({
      id: TEST_USER_RECORD.id,
      data: {
        password: 'newpassword',
      },
    })

    const result = await controller.checkPassword({
      username: TEST_USER_RECORD.username,
      password: 'newpassword',
    })

    t.ok(result, `the result was correct`)
  })

  asyncTest('user controller -> attempt update token via normal update handler', async (t) => {
    const controller = getController()

    let error = null

    try {
      await controller.update({
        id: TEST_USER_RECORD.id,
        data: {
          server_side_key: 'notallowed',
        },
      })
    } catch (err) {
      error = err
    }
    t.ok(error, `there was an error`)
    t.equal(error.toString(), `Error: access denied`, `error message is correct`)
  })

  asyncTest('user controller -> get token', async (t) => {
    const controller = getController()

    const token = await controller.getToken({
      id: TEST_USER_RECORD.id,
    })

    const user = await controller.get({
      id: TEST_USER_RECORD.id,
    })

    const decoded = await userUtils.decodeToken(token, config.tokenSecret)

    t.equal(decoded.id, user.id, `the id in the token is correct`)
    t.equal(decoded.server_side_key, user.server_side_key, `the server_side_key in the token is correct`)
  })

  asyncTest('user controller -> update token', async (t) => {
    const controller = getController()

    await controller.updateToken({
      id: TEST_USER_RECORD.id,
    })

    const result = await controller.get({
      id: TEST_USER_RECORD.id,
    })

    t.notEqual(result.server_side_key, TEST_USER_RECORD.server_side_key, 'the server_side_key is now different')
  })

  asyncTest('user controller -> delete', async (t) => {
    const controller = getController()

    await controller.delete({
      id: TEST_USER_RECORD.id,
    })

    const count = await controller.count({})
    t.equal(count, 0, `there were no users`)
  })
})
