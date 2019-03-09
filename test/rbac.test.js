'use strict'

const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const Store = require('../src/store')
const rbac = require('../src/rbac')
const config = require('../src/config')

const database = require('./database')
const fixtures = require('./fixtures')

const {
  RESOURCE_TYPES,
  PERMISSION_ROLE,
  PERMISSION_USER,
} = config

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}
  let roleMap = {}

  tape('rbac -> test initial account creation (no users) with no logged in user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: RESOURCE_TYPES.user,
      method: 'create',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> test initial account creation (no users) with a logged in user', (t) => {

    const store = Store(getConnection())

    rbac(store, {id: 1}, {
      resource_type: RESOURCE_TYPES.user,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })
  
  tape('rbac -> insert users', (t) => {

    fixtures.insertTestUsers(getConnection(), (err, users) => {
      t.notok(err, `there was no error`)
      userMap = users
      t.end()
    })
    
  })


  tape('rbac -> test bad resource_type', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: 'apples',
      method: 'list',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> test bad method', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      method: 'apples',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> test initial account creation (with users) with no logged in user', (t) => {

    const store = Store(getConnection())

    rbac(store, null, {
      resource_type: RESOURCE_TYPES.user,
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
      rbac(store, userMap[userType], {
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
    testWithUserTypes(t, RESOURCE_TYPES.user, 'list', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  tape('rbac -> user.get', (t) => {
    testWithUserTypes(t, RESOURCE_TYPES.user, 'get', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  tape('rbac -> user.create', (t) => {
    testWithUserTypes(t, RESOURCE_TYPES.user, 'create', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  tape('rbac -> user.update', (t) => {
    testWithUserTypes(t, RESOURCE_TYPES.user, 'update', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  tape('rbac -> user.delete', (t) => {
    testWithUserTypes(t, RESOURCE_TYPES.user, 'delete', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  tape('rbac -> user.get allowed for own record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> user.get not allowed for other record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.superuser.id,
      method: 'get',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> user.update allowed for own record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> user.update not allowed for other record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.superuser.id,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> user.token allowed for own record', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'token',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> user.token not allowed for other record even when user is admin', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'token',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> cluster.list', (t) => {

    testWithUserTypes(t, RESOURCE_TYPES.cluster, 'list', {
      none: false,
      user: true,
      admin: true,
      superuser: true,
    })
    
  })

  tape('rbac -> cluster.get allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> deployment.list allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
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
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> deployment.list not allowed for read with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
    
  })

  tape('rbac -> cluster.get not allowed for read with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
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
      data: {
        user: userMap.user.id,
        permission: PERMISSION_ROLE.read,
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
      }
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> cluster.get allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> deployment.list allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
    
  })

  tape('rbac -> cluster.create', (t) => {

    testWithUserTypes(t, RESOURCE_TYPES.cluster, 'create', {
      none: false,
      user: false,
      admin: true,
      superuser: true,
    })

  })

  tape('rbac -> cluster.update allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> cluster.update not allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create not allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete not allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> cluster.update not allowed for write with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create not allowed for write with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete not allowed for write with no role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
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
      data: {
        user: userMap.admin.id,
        permission: PERMISSION_ROLE.write,
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
      }
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> cluster.update allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> cluster.delete allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.get allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
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
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.create allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
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
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
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
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.delete allowed for superuser', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
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
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'delete',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

  tape('rbac -> deployment.get not allowed for read without role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
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
      data: {
        user: userMap.user.id,
        permission: PERMISSION_ROLE.read,
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
      }
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> deployment.get allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'get',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update not allowed for write without role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
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
      data: {
        user: userMap.admin.id,
        permission: PERMISSION_ROLE.write,
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
      }
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })    
  })

  tape('rbac -> deployment.update allowed for write with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('rbac -> deployment.update allowed for read with role', (t) => {

    const store = Store(getConnection())

    rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    }, (err) => {
      t.ok(err, `there was an error`)
      t.end()
    })
  })

})