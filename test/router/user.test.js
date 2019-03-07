'use strict'

const tape = require('tape')
const async = require('async')
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

  tape('user routes -> hasInitialUser (with no user)', (t) => {

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

  tape('user routes -> not logged in', (t) => {
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
      request(requestOptions, (err, res, body) => {
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

  tape('user routes -> hasInitialUser (with user)', (t) => {

    request({
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

  tape('user routes -> register not logged in now there is a user', (t) => {

    request({
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: NORMAL_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, 'access denied', 'correct error message')
      t.end()
    })
    
  })

  tape('user routes -> login with bad details', (t) => {

    request({
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

  tape('user routes -> login with admin user', (t) => {

    request({
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

})