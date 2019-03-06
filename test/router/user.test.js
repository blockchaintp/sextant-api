'use strict'

const tape = require('tape')
const Request = require('request')
const request = Request.defaults({jar: true})
const app = require('../app')

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

  const NORMAL_USER = {
    username: 'normal',
    password: 'oranges',
    role: 'write',
  }

  tape('user routes -> not logged in status', (t) => {

    request({
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

  tape('user routes -> hasInitialUser', (t) => {

    request({
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

  tape('user routes -> not logged in list', (t) => {

    request({
      method: 'get',
      url: `${url}/user`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 status`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> not logged in get', (t) => {

    request({
      method: 'get',
      url: `${url}/user/1`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 status`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> not logged in update', (t) => {

    request({
      method: 'put',
      url: `${url}/user/1`,
      json: true,
      body: {
        meta: {
          apples: 10,
        }
      }
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 status`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> not logged in delete', (t) => {

    request({
      method: 'delete',
      url: `${url}/user/1`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 status`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> register initial admin user', (t) => {

    request({
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: ADMIN_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      t.equal(body.username, ADMIN_USER.username, `the username is correct`)
      t.equal(body.role, 'admin', 'the user was created with admin role')
      t.end()
    })
    
  })

})