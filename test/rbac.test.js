'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const Store = require('../src/store')
const rbac = require('../src/rbac')

const database = require('./database')
const fixtures = require('./fixtures')

database.testSuiteWithDatabase(getConnection => {

  const INSERT_USERS = fixtures.SIMPLE_USER_DATA.concat([{
    username: 'readuser',
    password: 'readuser1',
    role: 'read',
  }])

  let userMap = {}
  let userMapByRole = {}
  let roleMap = {}

  tape('rbac -> test initial account creation (no users) with no logged in user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'user',
      method: 'create',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> test initial account creation (no users) with a logged in user', (t) => {

    const store = Store(getConnection())

    rbac(store, {id: 1}, {
      resource_type: 'user',
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })
  
  tape('rbac -> insert users', (t) => {

    fixtures.insertTestUsers(getConnection(), INSERT_USERS, (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      Object.keys(users).forEach(key => {
        const user = users[key]
        userMapByRole[user.role] = user
      })
      t.end()
    })
    
  })


  tape('rbac -> test bad resource_type', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'apples',
      method: 'list',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> test bad method', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'cluster',
      method: 'apples',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> test initial account creation (with users) with no logged in user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'user',
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  const testWithUserTypes = (t, resource_type, method, expectedResults) => {
    const store = Store(getConnection())

    async.eachSeries(Object.keys(expectedResults), (userType, nextUser) => {
      const expectedResult = expectedResults[userType]
      rbac(store, userMapByRole[userType], {
        resource_type,
        method,
      }, (err) => {
        if(expectedResult) {
          t.notok(err, `${resource_type}.${method}: there was no error for usertype: ${userType}`)
        }
        else {
          t.ok(err, `${resource_type}.${method}: there was an error for usertype: ${userType}`)
        }
        nextUser()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  }

  tape('rbac -> user.list', (t) => {
    testWithUserTypes(t, 'user', 'list', {
      none: false,
      read: false,
      write: false,
      admin: true,
    })
  })

  tape('rbac -> user.get', (t) => {
    testWithUserTypes(t, 'user', 'get', {
      none: false,
      read: false,
      write: false,
      admin: true,
    })
  })

  tape('rbac -> user.create', (t) => {
    testWithUserTypes(t, 'user', 'create', {
      none: false,
      read: false,
      write: false,
      admin: true,
    })
  })

  tape('rbac -> user.update', (t) => {
    testWithUserTypes(t, 'user', 'update', {
      none: false,
      read: false,
      write: false,
      admin: true,
    })
  })

  tape('rbac -> user.delete', (t) => {
    testWithUserTypes(t, 'user', 'delete', {
      none: false,
      read: false,
      write: false,
      admin: true,
    })
  })

  tape('rbac -> user.get allowed for own record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'user',
      resource_id: userMapByRole.read.id,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> user.get not allowed for other record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'user',
      resource_id: userMapByRole.admin.id,
      method: 'get',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> user.update allowed for own record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'user',
      resource_id: userMapByRole.read.id,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> user.update not allowed for other record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'user',
      resource_id: userMapByRole.admin.id,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> user.updateToken allowed for own record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'user',
      resource_id: userMapByRole.read.id,
      method: 'updateToken',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> user.updateToken not allowed for other record even when user is admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'user',
      resource_id: userMapByRole.read.id,
      method: 'updateToken',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> cluster.list', (t) => {

    testWithUserTypes(t, 'cluster', 'list', {
      none: false,
      read: true,
      write: true,
      admin: true,
    })
    
  })

  tape('rbac -> cluster.get allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> deployment.list allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> deployment.list not allowed for no user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> deployment.list not allowed for read with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> cluster.get not allowed for read with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  // insert a read role for a cluster for the read user
  tape('rbac -> cluster.get insert read role', (t) => {

    const store = Store(getConnection())

    store.role.create({
      user: userMapByRole.read.id,
      permission: 'read',
      resource_type: 'cluster',
      resource_id: 1,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> cluster.get allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> deplpyment.list allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> cluster.create', (t) => {

    testWithUserTypes(t, 'cluster', 'create', {
      none: false,
      read: false,
      write: true,
      admin: true,
    })

  })

  tape('rbac -> cluster.update allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> cluster.update not allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create not allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete not allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> cluster.update not allowed for write with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create not allowed for write with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete not allowed for write with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  // insert a write role for a cluster for the write user
  tape('rbac -> cluster.update insert write role', (t) => {

    const store = Store(getConnection())

    store.role.create({
      user: userMapByRole.write.id,
      permission: 'write',
      resource_type: 'cluster',
      resource_id: 1,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> cluster.update allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'cluster',
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.get allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.get not allowed for no user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create not allowed for no user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update not allowed for no user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.delete allowed for admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.admin, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.delete not allowed for no user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.get not allowed for read without role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  // insert a read role for a deployment for the read user
  tape('rbac -> deployment.get insert read role', (t) => {

    const store = Store(getConnection())

    store.role.create({
      user: userMapByRole.read.id,
      permission: 'read',
      resource_type: 'deployment',
      resource_id: 1,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> deployment.get allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update not allowed for write without role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  // insert a read role for a deployment for the read user
  tape('rbac -> deployment.update insert write role', (t) => {

    const store = Store(getConnection())

    store.role.create({
      user: userMapByRole.write.id,
      permission: 'write',
      resource_type: 'deployment',
      resource_id: 1,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> deployment.update allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.write, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMapByRole.read, {
      resource_type: 'deployment',
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

})