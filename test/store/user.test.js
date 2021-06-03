const tools = require('../tools')
const asyncTest = require('../asyncTest')

const database = require('../database')
const fixtures = require('../fixtures')

const config = require('../../src/config')
const enumerations = require('../../src/enumerations')

const UserStore = require('../../src/store/user')

database.testSuiteWithDatabase((getConnection) => {
  let userMap = {}

  asyncTest('user store -> list no data', async (t) => {
    const store = UserStore(getConnection())

    const users = await store.list()
    t.equal(users.length, 0, 'there were no users')
  })

  asyncTest('user store -> create with missing values', async (t) => {
    const store = UserStore(getConnection())

    await tools.insertWithMissingValues(t, store, {
      username: 'apples',
      permission: 'admin',
      server_side_key: 'na',
      hashed_password: 'na',
    })
  })

  asyncTest('user store -> create with bad role', async (t) => {
    const store = UserStore(getConnection())

    let error = null

    try {
      await store.create({
        data: {
          username: 'apples',
          hashed_password: 'na',
          server_side_key: 'na',
          permission: 'apples',
        },
      })
    } catch (err) {
      error = err
    }
    t.ok(error, 'there was an error')
  })

  asyncTest('user store -> create users', async (t) => {
    const users = await fixtures.insertTestUsers(getConnection())
    t.deepEqual(users.admin.meta, {}, 'the metadata defaults to empty object')
    userMap = users
  })

  asyncTest('user store -> list with ordered data', async (t) => {
    const store = UserStore(getConnection())

    const correctOrder = [].concat(enumerations.USER_TYPES)
    correctOrder.sort()

    const users = await store.list()
    t.equal(users.length, fixtures.SIMPLE_USER_DATA.length, `there were ${fixtures.SIMPLE_USER_DATA.length} users`)
    t.deepEqual(users.map((user) => user.username), correctOrder, 'the users were in the correct order')
  })

  asyncTest('user store -> get from username then id', async (t) => {
    const store = UserStore(getConnection())

    const usernameUser = await store.get({
      username: config.USER_TYPES.admin,
    })

    const idUser = await store.get({
      id: usernameUser.id,
    })

    t.equal(usernameUser.username, config.USER_TYPES.admin, 'the returned username is correct')
    t.equal(idUser.username, config.USER_TYPES.admin, 'the returned username is correct')
  })

  asyncTest('user store -> update user', async (t) => {
    const store = UserStore(getConnection())

    const updateUser = await store.update({
      id: userMap[config.USER_TYPES.admin].id,
      data: {
        username: 'oranges',
      },
    })

    const getUser = await store.get({
      username: 'oranges',
    })

    t.equal(updateUser.username, 'oranges', 'the new username is correct')
    t.equal(updateUser.id, getUser.id, 'querying on the updated user is working')
  })

  asyncTest('user store -> delete user', async (t) => {
    const store = UserStore(getConnection())

    await store.delete({
      id: userMap[config.USER_TYPES.admin].id,
    })

    const users = await store.list()
    t.equal(users.length, fixtures.SIMPLE_USER_DATA.length - 1, 'there is 1 less user')
  })
})
