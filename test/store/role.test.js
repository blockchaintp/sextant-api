const Promise = require('bluebird')
const tools = require('../tools')
const database = require('../database')
const fixtures = require('../fixtures')
const asyncTest = require('../asyncTest')

const RoleStore = require('../../src/store/role')
const config = require('../../src/config')

const {
  RESOURCE_TYPES,
  USER_TYPES,
  PERMISSION_TYPES,
} = config

database.testSuiteWithDatabase((getConnection) => {
  // eslint-disable-next-line no-unused-vars
  let userMap = {}
  let roleMap = {}
  let testUser = null

  asyncTest('role store -> create users', async () => {
    const users = await fixtures.insertTestUsers(getConnection())
    userMap = users
    testUser = users[USER_TYPES.admin]
  })

  asyncTest('role store -> list with no user', async (t) => {
    const store = RoleStore(getConnection())
    let error = null
    try {
      store.listForUser({})
    } catch (err) {
      error = err
    }
    t.ok(error, 'there was an error')
  })

  asyncTest('role store -> list no data', async (t) => {
    const store = RoleStore(getConnection())
    const roles = await store.listForUser({
      user: testUser.id,
    })
    t.equal(roles.length, 0, 'there were no roles')
  })

  asyncTest('role store -> create with missing values', async (t) => {
    const store = RoleStore(getConnection())

    await tools.insertWithMissingValues(t, store, {
      user: testUser.id,
      permission: PERMISSION_TYPES.read,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
    })
  })

  asyncTest('role store -> create with bad resource type', async (t) => {
    const store = RoleStore(getConnection())
    let error = null
    try {
      await store.create({
        data: {
          user: testUser.id,
          permission: PERMISSION_TYPES.read,
          resource_type: 'oranges',
          resource_id: 10,
        },
      })
    } catch (err) {
      error = err
    }
    t.ok(error, 'there was an error')
  })

  asyncTest('role store -> create roles', async (t) => {
    const compareRole = fixtures.SIMPLE_ROLE_DATA.filter((role) => role.resource_type === 'cluster')[0]

    const roles = await fixtures.insertTestRoles(getConnection(), testUser.id)
    t.equal(roles.cluster.user, testUser.id, 'the user is the correct id')
    t.equal(roles.cluster.permission, compareRole.permission, 'the permission the correct')
    t.equal(roles.cluster.resource_type, compareRole.resource_type, 'the resource_type the correct')
    t.equal(roles.cluster.resource_id, compareRole.resource_id, 'the resource_id the correct')
    roleMap = roles
  })

  asyncTest('role store -> list for user', async (t) => {
    const store = RoleStore(getConnection())
    const expectedCount = fixtures.SIMPLE_ROLE_DATA.length
    const roles = await store.listForUser({
      user: testUser.id,
    })
    t.equal(roles.length, expectedCount, `there were ${expectedCount} roles`)

    const loadedRoleMap = roles.reduce((all, role) => {
      all[role.resource_type] = role
      return all
    }, {})

    t.deepEqual(loadedRoleMap, roleMap, 'the loaded roles are correct')
  })

  asyncTest('role store -> list for resource', async (t) => {
    const store = RoleStore(getConnection())
    const role = fixtures.SIMPLE_ROLE_DATA[0]
    const roles = await store.listForResource({
      resource_type: role.resource_type,
      resource_id: role.resource_id,
    })
    t.equal(roles.length, 1, 'there were 1 role')
  })

  asyncTest('role store -> get with missing values', async (t) => {
    const store = RoleStore(getConnection())
    const baseObject = {
      user: testUser.id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
    }

    Promise.each(Object.keys(baseObject), async (field) => {
      const query = { ...baseObject }
      delete (query[field])
      let error = null
      try {
        store.get(query)
      } catch (err) {
        error = err
      }
      t.ok(error, `there was an error for missing field: ${field}`)
    })
  })

  asyncTest('role store -> get for cluster', async (t) => {
    const store = RoleStore(getConnection())
    const role = await store.get({
      user: testUser.id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
    })
    t.deepEqual(role, roleMap.cluster, 'the loaded cluster role is correct')
  })

  asyncTest('role store -> get for deployment', async (t) => {
    const store = RoleStore(getConnection())

    const role = await store.get({
      user: testUser.id,
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 11,
    })
    t.deepEqual(role, roleMap.deployment, 'the loaded deployment role is correct')
  })

  asyncTest('role store -> delete', async (t) => {
    const store = RoleStore(getConnection())
    const expectedCount = fixtures.SIMPLE_ROLE_DATA.length - 1

    await store.delete({
      id: roleMap.cluster.id,
    })
    const roles = await store.listForUser({
      user: testUser.id,
    })
    t.equal(roles.length, expectedCount, 'there is 1 less role')
    t.deepEqual(roles[0], roleMap.deployment, 'the remaining role is correct')
  })
})
