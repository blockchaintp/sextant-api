/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'

const tape = require('tape')
const async = require('async')
const app = require('../app')
const tools = require('../tools')

const config = require('../../src/config')

const {
  USER_TYPES,
} = config

app.testSuiteWithApp(({
  getConnection,
  url,
}) => {

  const SUPER_USER = {
    username: 'admin',
    password: 'apples',
    // we pass the read role as the initial user to ensure it's upgraded to admin
    permission: USER_TYPES.user,
  }

  const NORMAL_USER = {
    username: 'user',
    password: 'oranges',
    permission: USER_TYPES.user,
  }

  const USER_RECORDS = {}

  const updateToken = (t, id) => {

    let TOKEN = null

    async.series([
      next => {
        tools.sessionRequest({
          t,
          method: 'get',
          url: `${url}/user/${id}/token`,
          json: true,
        }, (err, res, body) => {
          t.notok(err, `there is no error`)
          t.equal(res.statusCode, 200, `200 status`)
          t.ok(body.token, `the token is present`)
          TOKEN = body.token
          next()
        })
      },

      next => {
        tools.sessionRequest({
          t,
          method: 'put',
          url: `${url}/user/${id}/token`,
          json: true,
        }, (err, res, body) => {
          t.notok(err, `there is no error`)
          t.equal(res.statusCode, 201, `201 code`)
          t.equal(body.ok, true, `the result is ok`)
          next()
        })
      },

      next => {
        tools.sessionRequest({
          t,
          method: 'get',
          url: `${url}/user/${id}/token`,
          json: true,
        }, (err, res, body) => {
          t.notok(err, `there is no error`)
          t.equal(res.statusCode, 200, `200 status`)
          t.ok(body.token, `the token is present`)
          t.notEqual(body.token, TOKEN, `the token is different than before`)
          next()
        })
      },
    ], (err) => {
      t.notok(err, `there is no error`)
      t.end()
    })
  }

  tape('user routes -> (not logged in) status', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/status`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body, null, `there is no user data`)
      t.end()
    })

  })

  tape('user routes -> (not logged in) hasInitialUser', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/hasInitialUser`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body, false, `there is no initial user`)
      t.end()
    })

  })

  tape('user routes ->  (not logged in) logout', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/logout`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 status`)
      t.equal(body.error, `not logged in`, `correct error message`)
      t.end()
    })

  })

  tape('user routes -> (not logged in) check routes are denied access', (t) => {
    const routes = [{
      method: 'get',
      url: `${url}/user`,
    }, {
      method: 'get',
      url: `${url}/user/1`,
    }, {
      method: 'put',
      url: `${url}/user/1`,
      body: {
        meta: {
          apples: 10,
        }
      },
    }, {
      method: 'delete',
      url: `${url}/user/1`,
    }]

    async.eachSeries(routes, (route, nextRoute) => {
      const requestOptions = Object.assign({}, route)
      requestOptions.json = true
      requestOptions.t = t
      tools.sessionRequest(requestOptions, (err, res, body) => {
        t.notok(err, `there is no error: ${route.url}`)
        t.equal(res.statusCode, 403, `403 status: ${route.url}`)
        t.equal(body.error, `Error: access denied`, `correct error: ${route.url}`)
        nextRoute()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('user routes -> (not logged in) register initial admin user', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: SUPER_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      t.equal(body.username, SUPER_USER.username, `the username is correct`)
      t.equal(body.permission, USER_TYPES.superuser, 'the user was created with superuser permission')
      t.notok(body.hashed_password, 'the hashed_password is not in the result')
      t.notok(body.server_side_key, 'the server_side_key is not in the result')
      t.end()
    })

  })

  tape('user routes -> (not logged in) hasInitialUser (with user)', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/hasInitialUser`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body, true, `there is an initial user`)
      t.end()
    })

  })

  tape('user routes -> (not logged in) try creating a user now there is an existing user', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: NORMAL_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'Error: access denied', 'correct error message')
      t.end()
    })

  })

  tape('user routes -> (not logged in) login with bad details', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: 'pears',
        password: 'oranges',
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'incorrect login details', 'correct error message')
      t.end()
    })

  })

  tape('user routes -> (as superuser) login', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: SUPER_USER.username,
        password: SUPER_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })

  })

  tape('user routes -> (as superuser) status', (t) => {
    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/status`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, SUPER_USER.username, `username correct`)
      t.equal(body.permission, USER_TYPES.superuser, `permission correct`)
      USER_RECORDS.superuser = body
      t.end()
    })

  })

  tape('user routes -> (as superuser) list', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.length, 1, `there is one user`)
      t.equal(body[0].username, SUPER_USER.username, `username correct`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) get user', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, SUPER_USER.username, `username correct`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) try to update own permission', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
      json: true,
      body: {
        permission: USER_TYPES.user,
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'cannot change own permission', 'correct error message')
      t.end()
    })

  })

  tape('user routes -> (as superuser) try to delete self', (t) => {

    tools.sessionRequest({
      t,
      method: 'delete',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'cannot delete yourself', 'correct error message')
      t.end()
    })

  })

  tape('user routes -> (as superuser) update own password', (t) => {

    SUPER_USER.password = 'newpassword'

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
      json: true,
      body: {
        password: SUPER_USER.password,
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.id, USER_RECORDS.superuser.id, `returned user id is correct`)
      t.equal(body.username, USER_RECORDS.superuser.username, `returned user id is correct`)
      t.notok(body.hashed_password, `no hashed_password in response`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) logout', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/logout`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, `ok was true`)
      t.end()
    })

  })

  tape('user routes -> (not logged in) status', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/status`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body, null, `there is no user data`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) login with new password', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: SUPER_USER.username,
        password: SUPER_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })

  })

  tape('user routes -> (as superuser) register read only user', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: NORMAL_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      t.equal(body.username, NORMAL_USER.username, `the username is correct`)
      t.equal(body.permission, USER_TYPES.user, 'the user was created with user permission')
      USER_RECORDS.normal = body
      t.end()
    })

  })

  tape('user routes -> (as superuser) update with empty password', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
      body: {
        username: USER_RECORDS.normal.username,
        permission: USER_RECORDS.normal.permission,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) allow update other user role', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
      body: {
        permission: USER_TYPES.admin,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.username, NORMAL_USER.username, `the username is correct`)
      t.equal(body.permission, USER_TYPES.admin, 'the user is updated with admin permission')
      t.end()
    })

  })

  // reset previous user's permissions
  tape('user routes -> (as superuser) allow update other user role', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
      body: {
        permission: USER_TYPES.user,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.username, NORMAL_USER.username, `the username is correct`)
      t.equal(body.permission, USER_TYPES.user, 'the user is reset to user permissions')
      t.end()
    })

  })

  tape('user routes -> (as superuser) get other user record as admin but cannot see server_side_key', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.notok(body.server_side_key, 'there is no server_side_key in the reply')
      t.end()
    })

  })

  tape('user routes -> (as superuser) attempt to update other users token', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.normal.id}/token`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `Error: access denied`, `correct error`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) attempt to get other users token', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/${USER_RECORDS.normal.id}/token`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `Error: access denied`, `correct error`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) update own token', (t) => {

    updateToken(t, USER_RECORDS.superuser.id)

  })

  tape('user routes -> (as superuser) logout', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/logout`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, `ok was true`)
      t.end()
    })

  })

  tape('user routes -> (as normal user) login', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: NORMAL_USER.username,
        password: NORMAL_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })

  })

  tape('user routes -> (as normal user) check route access', (t) => {

    const routes = [{
      method: 'get',
      url: `${url}/user`,
    }, {
      method: 'get',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
    }, {
      method: 'put',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
      body: {
        meta: {
          apples: 10,
        }
      },
    }, {
      method: 'post',
      url: `${url}/user`,
      body: {
        username: 'hacker',
        password: 'hacker',
        role: USER_TYPES.superuser,
        meta: {
          apples: 10,
        },
      },
    }, {
      method: 'delete',
      url: `${url}/user/${USER_RECORDS.superuser.id}`,
    }, {
      method: 'delete',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
    }]

    async.eachSeries(routes, (route, nextRoute) => {
      const requestOptions = Object.assign({}, route)
      requestOptions.json = true
      requestOptions.t = t
      tools.sessionRequest(requestOptions, (err, res, body) => {
        t.notok(err, `there is no error: ${route.url}`)
        t.equal(res.statusCode, 403, `403 status: ${route.url}`)
        t.equal(body.error, `Error: access denied`, `correct error: ${route.url}`)
        nextRoute()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('user routes -> (as normal user) get own record', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.username, NORMAL_USER.username, 'username is correct')
      t.equal(body.id, USER_RECORDS.normal.id, 'id is correct')
      t.notok(body.server_side_key, `cannot see server_side_key for read user reading own record`)
      t.end()
    })

  })

  tape('user routes -> (as normal user) update own record', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
      body: {
        meta: {
          othervalue: 20,
        }
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      tools.sessionRequest({
        t,
        method: 'get',
        url: `${url}/user/${USER_RECORDS.normal.id}`,
        json: true,
      }, (err, res, body) => {
        t.notok(err, `there is no error`)
        t.equal(res.statusCode, 200, `200 code`)
        t.equal(body.meta.othervalue, 20, `updated value is correct`)
        t.end()
      })
    })

  })

  tape('user routes -> (as normal user) attempt to update server_side_key via update method', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.normal.id}`,
      json: true,
      body: {
        server_side_key: 'badtoken',
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'cannot change server_side_key via update', `error message was correct`)
      t.end()
    })

  })

  tape('user routes -> (as normal user) attempt to update other users token', (t) => {

    tools.sessionRequest({
      t,
      method: 'put',
      url: `${url}/user/${USER_RECORDS.superuser.id}/token`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `Error: access denied`, `correct error`)
      t.end()
    })

  })

  tape('user routes -> (as normal user) update own token', (t) => {
    updateToken(t, USER_RECORDS.normal.id)
  })

  tape('user routes -> (as normal user) logout', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/logout`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, `ok was true`)
      t.end()
    })

  })

  tape('user routes -> (as superuser) login', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: SUPER_USER.username,
        password: SUPER_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })

  })

  tape('user routes -> (as superuser) delete user', (t) => {

    const counts = {}

    const countUsers = (name) => (done) => {
      tools.sessionRequest({
        t,
        method: 'get',
        url: `${url}/user`,
        json: true,
      }, (err, res, body) => {
        if(err) return done(err)
        t.equal(res.statusCode, 200, `200 status`)
        counts[name] = body.length
        done()
      })
    }

    async.series([
      countUsers('beforeDelete'),

      next => {
        tools.sessionRequest({
          t,
          method: 'delete',
          url: `${url}/user/${USER_RECORDS.normal.id}`,
          json: true,
        }, (err, res, body) => {
          if(err) return next(err)
          t.equal(res.statusCode, 200, `200 code`)
          next()
        })
      },

      countUsers('afterDelete'),
    ], (err) => {
      t.notok(err, `there is no error`)
      t.equal(counts.afterDelete, counts.beforeDelete-1, `there is one less user`)
      t.end()
    })

  })


  tape('user routes -> (as normal user) logout', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/logout`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, `ok was true`)
      t.end()
    })

  })

})
