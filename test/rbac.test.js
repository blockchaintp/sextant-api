'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const database = require('./database')
const fixtures = require('./fixtures')

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}
  let roleMap = {}
  
  tape('rbac -> insert users', (t) => {

    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
    
  })

  tape('rbac -> insert roles', (t) => {

    fixtures.insertTestRoles(getConnection(), userMap.apples.id, (err, roles) => {
      t.notok(err, `there was no error`)
      roleMap = roles
      t.end()
    })
    
  })

})