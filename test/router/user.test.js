'use strict'

const tape = require('tape')
const async = require('async')
const app = require('../app')
const tools = require('../tools')

app.testSuiteWithApp(({
  getConnection,
  url,
}) => {

  const ADMIN_USER = {
    username: 'admin',
    password: 'apples',
    // we pass the read role as the initial user to ensure it's upgraded to admin
    role: 'read',
  }

  const READ_USER = {
    username: 'read',
    password: 'oranges',
    role: 'read',
  }

  const USER_RECORDS = {}

  const updateToken = (t, id) => {

    let TOKEN = null
    async.series([
      next => {
        tools.sessionRequest({
          method: 'get',
          url: `${url}/user/${id}`,
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
          method: 'get',
          url: `${url}/user/${id}`,
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
      tools.sessionRequest(requestOptions, (err, res, body) => {
        t.notok(err, `there is no error: ${route.url}`)
        t.equal(res.statusCode, 403, `403 status: ${route.url}`)
        t.equal(body.error, `access denied`, `correct error: ${route.url}`)
        nextRoute()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('user routes -> (not logged in) register initial admin user', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: ADMIN_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      t.equal(body.username, ADMIN_USER.username, `the username is correct`)
      t.equal(body.role, 'admin', 'the user was created with admin role')
      t.notok(body.hashed_password, 'the hashed_password is not in the result')
      t.notok(body.token_salt, 'the token_salt is not in the result')
      t.notok(body.token, 'the token is not in the result')
      t.end()
    })
    
  })

  tape('user routes -> (not logged in) hasInitialUser (with user)', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/hasInitialUser`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body, true, `there is no initial user`)
      t.end()
    })
    
  })

  tape('user routes -> (not logged in) register now there is a user', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: READ_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'access denied', 'correct error message')
      t.end()
    })
    
  })

  tape('user routes -> (not logged in) login with bad details', (t) => {

    tools.sessionRequest({
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

  tape('user routes -> (as admin) login', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: ADMIN_USER.username,
        password: ADMIN_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })
    
  })

  tape('user routes -> (as admin) status', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/status`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, ADMIN_USER.username, `username correct`)
      t.equal(body.role, 'admin', `role correct`)
      USER_RECORDS.admin = body
      t.end()
    })
    
  })

  tape('user routes -> (as admin) list', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.length, 1, `there is one user`)
      t.equal(body[0].username, ADMIN_USER.username, `username correct`)
      t.end()
    })
    
  })

  tape('user routes -> (as admin) get user', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, ADMIN_USER.username, `username correct`)
      t.ok(body.token, `the token is present for reading your own record`)
      t.end()
    })
    
  })

  tape('user routes -> (as admin) try to update own role', (t) => {

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
      json: true,
      body: {
        role: 'write',
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'cannot change own role', 'correct error message')
      t.end()
    })
    
  })

  tape('user routes -> (as admin) try to delete self', (t) => {

    tools.sessionRequest({
      method: 'delete',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'cannot delete yourself', 'correct error message')
      t.end()
    })
    
  })

  tape('user routes -> (as admin) update own password', (t) => {

    ADMIN_USER.password = 'newpassword'

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
      json: true,
      body: {
        password: ADMIN_USER.password,
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `403 code`)
      t.equal(body.id, USER_RECORDS.admin.id, `returned user id is correct`)
      t.equal(body.username, USER_RECORDS.admin.username, `returned user id is correct`)
      t.equal(body.hashed_password, undefined, `no hashed_password in response`)
      t.end()
    })
    
  })

  tape('user routes -> (as admin) logout', (t) => {

    tools.sessionRequest({
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

  tape('user routes -> (as admin) login with new password', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: ADMIN_USER.username,
        password: ADMIN_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })
    
  })

  tape('user routes -> (as admin) register read only user', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: READ_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      t.equal(body.username, READ_USER.username, `the username is correct`)
      t.equal(body.role, 'read', 'the user was created with read role')
      USER_RECORDS.read = body
      t.end()
    })
    
  })

  tape('user routes -> (as admin) allow update other user role', (t) => {

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.read.id}`,
      json: true,
      body: {
        role: 'write',
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.username, READ_USER.username, `the username is correct`)
      t.equal(body.role, 'write', 'the user is updated with write role')
      t.end()
    })
    
  })

  tape('user routes -> (as admin) get other user record as admin but cannot see token', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/${USER_RECORDS.read.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.notok(body.token, 'there is no token in the reply')
      t.end()
    })
    
  })

  tape('user routes -> (as admin) attempt to update other users token', (t) => {

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.read.id}/token`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> (as admin) update own token', (t) => {

    updateToken(t, USER_RECORDS.admin.id)
    
  })

  tape('user routes -> (as admin) logout', (t) => {

    tools.sessionRequest({
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

  tape('user routes -> (as read user) login', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: READ_USER.username,
        password: READ_USER.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })
    
  })

  tape('user routes -> (as read user) check route access', (t) => {
    const routes = [{
      method: 'get',
      url: `${url}/user`,
    }, {
      method: 'get',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
    }, {
      method: 'put',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
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
        role: 'admin',
        meta: {
          apples: 10,
        },
      },
    }, {
      method: 'delete',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
    }, {
      method: 'delete',
      url: `${url}/user/${USER_RECORDS.read.id}`,
    }]

    async.eachSeries(routes, (route, nextRoute) => {
      const requestOptions = Object.assign({}, route)
      requestOptions.json = true
      tools.sessionRequest(requestOptions, (err, res, body) => {
        t.notok(err, `there is no error: ${route.url}`)
        t.equal(res.statusCode, 403, `403 status: ${route.url}`)
        t.equal(body.error, `access denied`, `correct error: ${route.url}`)
        nextRoute()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('user routes -> (as read user) get own record', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/${USER_RECORDS.read.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.username, READ_USER.username, 'username is correct')
      t.equal(body.id, USER_RECORDS.read.id, 'id is correct')
      t.ok(body.token, `can see token for read user reading own record`)
      t.end()
    })
    
  })

  tape('user routes -> (as read user) update own record', (t) => {

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.read.id}`,
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
        method: 'get',
        url: `${url}/user/${USER_RECORDS.read.id}`,
        json: true,
      }, (err, res, body) => {
        t.notok(err, `there is no error`)
        t.equal(res.statusCode, 200, `200 code`)
        t.equal(body.meta.othervalue, 20, `updated value is correct`)
        t.end()
      })
    })
    
  })

  tape('user routes -> (as read user) attempt to update token via update method', (t) => {

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.read.id}`,
      json: true,
      body: {
        token: 'badtoken',
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'cannot change token via update', `error message was correct`)
      t.end()
    })
    
  })

  tape('user routes -> (as read user) attempt to update other users token', (t) => {

    tools.sessionRequest({
      method: 'put',
      url: `${url}/user/${USER_RECORDS.admin.id}/token`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> (as read user) update own token', (t) => {
    updateToken(t, USER_RECORDS.read.id)
  })

  tape('user routes -> (as read user) logout', (t) => {

    tools.sessionRequest({
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