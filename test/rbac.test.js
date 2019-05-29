'use strict'

const Promise = require('bluebird')
const tape = require('tape')
const async = require('async')
const tools = require('./tools')

const Store = require('../src/store')
const rbac = require('../src/rbac')
const config = require('../src/config')

const asyncTest = require('./asyncTest')
const asyncTestError = require('./asyncTestError')

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

  asyncTest('rbac -> test initial account creation (no users) with no logged in user', async (t) => {
    const store = Store(getConnection())
    const result = await rbac(store, null, {
      resource_type: RESOURCE_TYPES.user,
      method: 'create',
    })
    t.equal(result, true, `the result was ok`)
  })

  asyncTestError('rbac -> test initial account creation (no users) with a logged in user', async (t) => {
    const store = Store(getConnection())
    await rbac(store, {id: 1}, {
      resource_type: RESOURCE_TYPES.user,
      method: 'create',
    })
  })
  
  asyncTest('rbac -> insert users', async (t) => {
    const users = await fixtures.insertTestUsers(getConnection())
    userMap = users
  })


  asyncTestError('rbac -> test bad resource_type', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: 'apples',
      method: 'list',
    })
    
  })

  asyncTestError('rbac -> test bad method', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      method: 'apples',
    })
    
  })

  asyncTestError('rbac -> test initial account creation (with users) with no logged in user', async (t) => {

    const store = Store(getConnection())

    await rbac(store, null, {
      resource_type: RESOURCE_TYPES.user,
      method: 'create',
    })
    
  })

  const testWithUserTypes = (t, resource_type, method, expectedResults) => {
    const store = Store(getConnection())

    return Promise.each(Object.keys(expectedResults), async (userType) => {
      const expectedResult = expectedResults[userType]
      let error = null

      try {
        await rbac(store, userMap[userType], {
          resource_type,
          method,
        })
      } catch(err) {
        error = err
      }
     
      if(expectedResult) {
        t.notok(error, `${resource_type}.${method}: there was no error for usertype: ${userType}`)
      }
      else {
        t.ok(error, `${resource_type}.${method}: there was an error for usertype: ${userType}`)
      }
    })
  }

  asyncTest('rbac -> user.list', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'list', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.get', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'get', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.create', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'create', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.update', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'update', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.delete', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'delete', {
      none: false,
      user: false,
      admin: false,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.get allowed for own record', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'get',
    })
    
  })

  asyncTestError('rbac -> user.get not allowed for other record', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.superuser.id,
      method: 'get',
    })
    
  })

  asyncTest('rbac -> user.update allowed for own record', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'update',
    })
    
  })

  asyncTestError('rbac -> user.update not allowed for other record', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.superuser.id,
      method: 'update',
    })
    
  })

  asyncTest('rbac -> user.token allowed for own record', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'token',
    })
    
  })

  asyncTestError('rbac -> user.token not allowed for other record even when user is admin', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.user,
      resource_id: userMap.user.id,
      method: 'token',
    })
    
  })

  asyncTest('rbac -> cluster.list', async (t) => {

    await testWithUserTypes(t, RESOURCE_TYPES.cluster, 'list', {
      none: false,
      user: true,
      admin: true,
      superuser: true,
    })
    
  })

  asyncTest('rbac -> cluster.get allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'get',
    })
    
  })

  asyncTest('rbac -> deployment.list allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    })
    
  })

  asyncTestError('rbac -> deployment.list not allowed for no user', async (t) => {

    const store = Store(getConnection())

    await rbac(store, null, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    })
    
  })

  asyncTest('rbac -> deployment.list not allowed for read with no role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    })
    
  })

  asyncTestError('rbac -> cluster.get not allowed for read with no role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'get',
    })
    
  })

  // insert a read role for a cluster for the read user
  asyncTest('rbac -> cluster.get insert read role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.user.id,
        permission: PERMISSION_ROLE.read,
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
      }
    })    
  })

  asyncTest('rbac -> cluster.get allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'get',
    })
    
  })

  asyncTest('rbac -> deployment.list allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'list',
    })
    
  })

  asyncTest('rbac -> cluster.create', async (t) => {

    await testWithUserTypes(t, RESOURCE_TYPES.cluster, 'create', {
      none: false,
      user: false,
      admin: true,
      superuser: true,
    })

  })

  asyncTest('rbac -> cluster.update allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTest('rbac -> cluster.delete allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    })
  })

  asyncTestError('rbac -> cluster.update not allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTestError('rbac -> deployment.create not allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    })
  })

  asyncTestError('rbac -> cluster.delete not allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    })
  })

  asyncTestError('rbac -> cluster.update not allowed for write with no role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTestError('rbac -> deployment.create not allowed for write with no role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    })
  })

  asyncTestError('rbac -> cluster.delete not allowed for write with no role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    })
  })

  // insert a write role for a cluster for the write user
  asyncTest('rbac -> cluster.update insert write role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.admin.id,
        permission: PERMISSION_ROLE.write,
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
      }
    })   
  })

  asyncTest('rbac -> cluster.update allowed for write with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTest('rbac -> deployment.create allowed for write with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    })
  })

  asyncTest('rbac -> cluster.delete allowed for write with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.cluster,
      resource_id: 1,
      method: 'delete',
    })
  })

  asyncTest('rbac -> deployment.get allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'get',
    })
  })

  asyncTestError('rbac -> deployment.get not allowed for no user', async (t) => {

    const store = Store(getConnection())

    await rbac(store, null, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'get',
    })
  })

  asyncTest('rbac -> deployment.create allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    })
  })

  asyncTestError('rbac -> deployment.create not allowed for no user', async (t) => {

    const store = Store(getConnection())

    await rbac(store, null, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'create',
    })
  })

  asyncTest('rbac -> deployment.update allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTestError('rbac -> deployment.update not allowed for no user', async (t) => {

    const store = Store(getConnection())

    await rbac(store, null, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTest('rbac -> deployment.delete allowed for superuser', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.superuser, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'delete',
    })
  })

  asyncTestError('rbac -> deployment.delete not allowed for no user', async (t) => {

    const store = Store(getConnection())

    await rbac(store, null, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'delete',
    })
  })

  asyncTestError('rbac -> deployment.get not allowed for read without role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'get',
    })
  })

  // insert a read role for a deployment for the read user
  asyncTest('rbac -> deployment.get insert read role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.user.id,
        permission: PERMISSION_ROLE.read,
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
      }
    })    
  })

  asyncTest('rbac -> deployment.get allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'get',
    })
  })

  asyncTestError('rbac -> deployment.update not allowed for write without role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    })
  })

  // insert a read role for a deployment for the read user
  asyncTest('rbac -> deployment.update insert write role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.admin.id,
        permission: PERMISSION_ROLE.write,
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
      }
    })    
  })

  asyncTest('rbac -> deployment.update allowed for write with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.admin, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    })
  })

  asyncTestError('rbac -> deployment.update allowed for read with role', async (t) => {

    const store = Store(getConnection())

    await rbac(store, userMap.user, {
      resource_type: RESOURCE_TYPES.deployment,
      resource_id: 1,
      method: 'update',
    })
  })

})