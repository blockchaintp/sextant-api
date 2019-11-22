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
  PERMISSION_TYPES,
  USER_TYPES,
} = config

database.testSuiteWithDatabase(getConnection => {

  let userMap = {}
  let roleMap = {}

  const rbacTest = async ({
    t,
    user,
    action,
    expectedResult,
  }) => {
    const store = Store(getConnection())
    const result = await rbac(store, user, action)
    t.equal(result, expectedResult, `the result was correct`)
  }

  asyncTest('rbac -> test initial account creation (no users) with no logged in user', async (t) => {
    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.user,
        method: 'create',
      },
      expectedResult: true,
    })
  })

  asyncTest('rbac -> test initial account creation (no users) with a logged in user', async (t) => {
    await rbacTest({
      t,
      user: {id: 1},
      action: {
        resource_type: RESOURCE_TYPES.user,
        method: 'create',
      },
      expectedResult: false,
    })
  })
  
  asyncTest('rbac -> insert users', async (t) => {
    const users = await fixtures.insertTestUsers(getConnection())
    userMap = users
  })


  asyncTestError('rbac -> test bad resource_type', async (t) => {
    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: 'apples',
        method: 'list',
      },
      expectedResult: false,
    })
  })

  asyncTestError('rbac -> test bad method', async (t) => {
    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        method: 'apples',
      },
      expectedResult: false,
    })
  })

  asyncTest('rbac -> test initial account creation (with users) with no logged in user', async (t) => {

    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.user,
        method: 'create',
      },
      expectedResult: false,
    })
    
  })

  const testWithUserTypes = (t, resource_type, method, expectedResults) => {
    return Promise.each(Object.keys(expectedResults), async (userType) => {
      const expectedResult = expectedResults[userType]
      await rbacTest({
        t,
        user: userMap[userType],
        action: {
          resource_type,
          method,
        },
        expectedResult,
      })
    })
  }

  asyncTest('rbac -> user.list', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'list', {
      none: false,
      user: false,
      admin: true,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.get', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'get', {
      none: false,
      user: false,
      admin: true,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.create', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'create', {
      none: false,
      user: false,
      admin: true,
      superuser: true,
    })
  })

  asyncTest('rbac -> user.update', async (t) => {
    await testWithUserTypes(t, RESOURCE_TYPES.user, 'update', {
      none: false,
      user: false,
      admin: true,
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

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.user,
        resource_id: userMap.user.id,
        method: 'get',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> user.get not allowed for other record', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.user,
        resource_id: userMap.superuser.id,
        method: 'get',
      },
      expectedResult: false,
    })

    
  })

  asyncTest('rbac -> user.update allowed for own record', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.user,
        resource_id: userMap.user.id,
        method: 'update',
      },
      expectedResult: true,
    })

    
  })

  asyncTest('rbac -> user.update not allowed for other record', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.user,
        resource_id: userMap.superuser.id,
        method: 'update',
      },
      expectedResult: false,
    })

  })

  asyncTest('rbac -> user.token allowed for own record', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.user,
        resource_id: userMap.user.id,
        method: 'token',
      },
      expectedResult: true,
    })
    
  })

  asyncTest('rbac -> user.token not allowed for other record even when user is admin', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.user,
        resource_id: userMap.user.id,
        method: 'token',
      },
      expectedResult: false,
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

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: true,
    })
    
  })

  asyncTest('rbac -> deployment.list allowed for superuser', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'list',
      },
      expectedResult: true,
    })

    
  })

  asyncTest('rbac -> deployment.list not allowed for no user', async (t) => {

    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'list',
      },
      expectedResult: false,
    })

    
  })

  asyncTest('rbac -> deployment.list not allowed for read with no role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'list',
      },
      expectedResult: true,
    })
    
  })

  asyncTest('rbac -> cluster.get not allowed for read with no role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: false,
    })

  })

  // insert a read role for a cluster for the read user
  asyncTest('rbac -> cluster.get insert read role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.user.id,
        permission: PERMISSION_TYPES.read,
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
      }
    })    
  })

  asyncTest('rbac -> cluster.get allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: true,
    })
    
  })

  asyncTest('rbac -> deployment.list allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'list',
      },
      expectedResult: true,
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

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> cluster.delete allowed for superuser', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'delete',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> cluster.update not allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: false,
    })

  })

  asyncTest('rbac -> deployment.create not allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'create',
      },
      expectedResult: false,
    })
  
  })

  asyncTest('rbac -> cluster.delete not allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'delete',
      },
      expectedResult: false,
    })
  
  })

  asyncTest('rbac -> cluster.update not allowed for write with no role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: false,
    })
  
  })

  asyncTest('rbac -> deployment.create not allowed for write with no role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'create',
      },
      expectedResult: false,
    })
  
  })

  asyncTest('rbac -> cluster.delete not allowed for write with no role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'delete',
      },
      expectedResult: false,
    })
  
  })

  // insert a write role for a cluster for the write user
  asyncTest('rbac -> cluster.update insert write role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.admin.id,
        permission: PERMISSION_TYPES.write,
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
      }
    })   
  })

  asyncTest('rbac -> cluster.update allowed for write with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.create allowed for write with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        cluster_id: 1,
        resource_id: 1,
        method: 'create',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> cluster.delete allowed for write with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.cluster,
        resource_id: 1,
        method: 'delete',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.get allowed for superuser', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.get not allowed for no user', async (t) => {

    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: false,
    })

  })

  asyncTest('rbac -> deployment.create allowed for superuser', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'create',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.create not allowed for no user', async (t) => {

    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'create',
      },
      expectedResult: false,
    })

  })

  asyncTest('rbac -> deployment.update allowed for superuser', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.update not allowed for no user', async (t) => {

    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: false,
    })

  })

  asyncTest('rbac -> deployment.delete allowed for superuser', async (t) => {

    await rbacTest({
      t,
      user: userMap.superuser,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'delete',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.delete not allowed for no user', async (t) => {

    await rbacTest({
      t,
      user: null,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'delete',
      },
      expectedResult: false,
    })

  })

  asyncTest('rbac -> deployment.get not allowed for read without role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: false,
    })

  })

  // insert a read role for a deployment for the read user
  asyncTest('rbac -> deployment.get insert read role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.user.id,
        permission: PERMISSION_TYPES.read,
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
      }
    })    
  })

  asyncTest('rbac -> deployment.get allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'get',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.update not allowed for write without role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: false,
    })

  })

  // insert a read role for a deployment for the read user
  asyncTest('rbac -> deployment.update insert write role', async (t) => {

    const store = Store(getConnection())

    await store.role.create({
      data: {
        user: userMap.admin.id,
        permission: PERMISSION_TYPES.write,
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
      }
    })    
  })

  asyncTest('rbac -> deployment.update allowed for write with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.admin,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: true,
    })

  })

  asyncTest('rbac -> deployment.update allowed for read with role', async (t) => {

    await rbacTest({
      t,
      user: userMap.user,
      action: {
        resource_type: RESOURCE_TYPES.deployment,
        resource_id: 1,
        method: 'update',
      },
      expectedResult: false,
    })
  })

})