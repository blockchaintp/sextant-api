'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('../tools')
const database = require('../database')
const fixtures = require('../fixtures')

const RoleStore = require('../../src/store/role')
const config = require('../../src/config')

const {
  RESOURCE_TYPES,
  PERMISSION_USER,
  PERMISSION_ROLE,
} = config

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}
  let roleMap = {}
  let testUser = null

  tape('role store -> create users', (t) => {

    fixtures.insertTestUsers(getConnection(), tools.errorWrapper(t, (users) => {
      userMap = users
      testUser = users[PERMISSION_USER.admin]
      t.end()
    }))
  
  })

  tape('role store -> list with no user', (t) => {

    const store = RoleStore(getConnection())
  
    store.listForUser({}, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('role store -> list no data', (t) => {

    const store = RoleStore(getConnection())
  
    store.listForUser({
      user: testUser.id,
    }, tools.errorWrapper(t, (roles) => {
      t.equal(roles.length, 0, `there were no roles`)
      t.end()
    }))
    
  })

  tape('role store -> create with missing values', (t) => {

    const store = RoleStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      user: testUser.id,
      permission: PERMISSION_ROLE.read,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
    })
  })

  tape('role store -> create with bad resource type', (t) => {

    const store = RoleStore(getConnection())

    store.create({
      data: {
        user: testUser.id,
        permission: PERMISSION_ROLE.read,
        resource_type: 'oranges',
        resource_id: 10,
      }
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('role store -> create roles', (t) => {

    const compareRole = fixtures.SIMPLE_ROLE_DATA.filter(role => role.resource_type == 'cluster')[0]

    fixtures.insertTestRoles(getConnection(), testUser.id, tools.errorWrapper(t, (roles) => {
      t.equal(roles.cluster.user, testUser.id, `the user is the correct id`)
      t.equal(roles.cluster.permission, compareRole.permission, `the permission the correct`)
      t.equal(roles.cluster.resource_type, compareRole.resource_type, `the resource_type the correct`)
      t.equal(roles.cluster.resource_id, compareRole.resource_id, `the resource_id the correct`)
      roleMap = roles
      t.end()
    }))
  })

  tape('role store -> list for user', (t) => {
  
    const store = RoleStore(getConnection())

    const expectedCount = fixtures.SIMPLE_ROLE_DATA.length
  
    store.listForUser({
      user: testUser.id,
    }, tools.errorWrapper(t, (roles) => {
      t.equal(roles.length, expectedCount, `there were ${expectedCount} roles`)

      const loadedRoleMap = roles.reduce((all, role) => {
        all[role.resource_type] = role
        return all
      }, {})

      t.deepEqual(loadedRoleMap, roleMap, `the loaded roles are correct`)
      t.end()
    }))
    
  })

  tape('role store -> list for resource', (t) => {
  
    const store = RoleStore(getConnection())

    const role = fixtures.SIMPLE_ROLE_DATA[0]
  
    store.listForResource({
      resource_type: role.resource_type,
      resource_id: role.resource_id,
    }, tools.errorWrapper(t, (roles) => {
      t.equal(roles.length, 1, `there were 1 role`)
      t.end()
    }))
    
  })

  tape('role store -> get with missing values', (t) => {
  
    const store = RoleStore(getConnection())

    const baseObject = {
      user: testUser.id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
    }

    async.eachSeries(Object.keys(baseObject), (field, nextField) => {
      const query = Object.assign({}, baseObject)
      delete(query[field])
      store.get(query, (err) => {
        t.ok(err, `there was an error for missing field: ${field}`)
        nextField()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })

  
  })

  tape('role store -> get for cluster', (t) => {
  
    const store = RoleStore(getConnection())

    store.get({
      user: testUser.id,
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 10,
    }, tools.errorWrapper(t, (role) => {
      t.deepEqual(role, roleMap.cluster, `the loaded cluster role is correct`)
      t.end()
    }))
  
  })

  tape('role store -> get for deployment', (t) => {
  
    const store = RoleStore(getConnection())

    store.get({
      user: testUser.id,
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 11,
    }, tools.errorWrapper(t, (role) => {
      t.deepEqual(role, roleMap.deployment, `the loaded deployment role is correct`)
      t.end()
    }))
  
  })

  tape('role store -> delete', (t) => {
  
    const store = RoleStore(getConnection())

    const expectedCount = fixtures.SIMPLE_ROLE_DATA.length - 1

    store.delete({
      id: roleMap.cluster.id,
    }, tools.errorWrapper(t, () => {
      store.listForUser({
        user: testUser.id,
      }, tools.errorWrapper(t, (roles) => {
        t.equal(roles.length, expectedCount, `there is 1 less role`)
        t.deepEqual(roles[0], roleMap.deployment, 'the remaining role is correct')
        t.end()
      }))
    }))
    
  })

})