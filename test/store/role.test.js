'use strict'

const tape = require('tape')
const tools = require('../tools')
const database = require('../database')
const fixtures = require('../fixtures')

const RoleStore = require('../../src/store/role')

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}
  let testUser = null

  tape('role store -> create users', (t) => {

    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      testUser = users.apples
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

  tape('role store -> insert with missing values', (t) => {

    const store = RoleStore(getConnection())

    tools.insertWithMissingValues(t, store, {
      user: testUser.id,
      permission: 'read',
      resource_type: 'apples',
      resource_id: 10,
    })
  })

})