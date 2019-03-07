'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('../tools')
const database = require('../database')
const fixtures = require('../fixtures')

const RoleStore = require('../../src/store/role')

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}
  let roleMap = {}
  let testUser = null

  tape('role store -> create users', (t) => {

    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      testUser = users.write
      t.end()
    })
  
  })

  tape('role store -> list with no user', (t) => {

    const store = RoleStore(getConnection())
  
    store.list({}, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('role store -> list no data', (t) => {

    const store = RoleStore(getConnection())
  
    store.list({
      user: testUser.id,
    }, (err, roles) => {
      t.notok(err, `there was no error`)
      t.equal(roles.length, 0, `there were no roles`)
      t.end()
    })
    
  })

  tape('role store -> create with missing values', (t) => {

    const store = RoleStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      user: testUser.id,
      permission: 'read',
      resource_type: 'cluster',
      resource_id: 10,
    })
  })

  tape('role store -> create with bad resource type', (t) => {

    const store = RoleStore(getConnection())

    store.create({
      user: testUser.id,
      permission: 'read',
      resource_type: 'oranges',
      resource_id: 10,
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('role store -> create roles', (t) => {

    const compareRole = fixtures.SIMPLE_ROLE_DATA.filter(role => role.resource_type == 'cluster')[0]

    fixtures.insertTestRoles(getConnection(), testUser.id, (err, roles) => {
      t.notok(err, `there was no error`)
      t.equal(roles.cluster.user, testUser.id, `the user is the correct id`)
      t.equal(roles.cluster.permission, compareRole.permission, `the permission the correct`)
      t.equal(roles.cluster.resource_type, compareRole.resource_type, `the resource_type the correct`)
      t.equal(roles.cluster.resource_id, compareRole.resource_id, `the resource_id the correct`)
      roleMap = roles
      t.end()
    })
  })

  tape('role store -> list', (t) => {
  
    const store = RoleStore(getConnection())
  
    store.list({
      user: testUser.id,
    }, (err, roles) => {
      t.notok(err, `there was no error`)
      t.equal(roles.length, 2, `there were 2 roles`)

      const loadedRoleMap = roles.reduce((all, role) => {
        all[role.resource_type] = role
        return all
      }, {})

      t.deepEqual(loadedRoleMap, roleMap, `the loaded roles are correct`)
      t.end()
    })
    
  })

  tape('role store -> get with missing values', (t) => {
  
    const store = RoleStore(getConnection())

    const baseObject = {
      user: testUser.id,
      resource_type: 'cluster',
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
      resource_type: 'cluster',
      resource_id: 10,
    }, (err, role) => {
      t.notok(err, `there was no error`)
      t.deepEqual(role, roleMap.cluster, `the loaded cluster role is correct`)
      t.end()
    })
  
  })

  tape('role store -> get for deployment', (t) => {
  
    const store = RoleStore(getConnection())

    store.get({
      user: testUser.id,
      resource_type: 'deployment',
      resource_id: 11,
    }, (err, role) => {
      t.notok(err, `there was no error`)
      t.deepEqual(role, roleMap.deployment, `the loaded deployment role is correct`)
      t.end()
    })
  
  })

  tape('role store -> delete', (t) => {
  
    const store = RoleStore(getConnection())

    store.delete({
      id: roleMap.cluster.id,
    }, (err) => {
      t.notok(err, `there was no error`)
      store.list({
        user: testUser.id,
      },(err, roles) => {
        t.notok(err, `there was no error`)
        t.equal(roles.length, 1, `there is 1 role`)
        t.deepEqual(roles[0], roleMap.deployment, 'the remaining role is correct')
        t.end()
      })
    })
    
  })

})