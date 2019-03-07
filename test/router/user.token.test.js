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
  const USER_TOKENS = {}

  tape('user routes -> register initial admin user', (t) => {

    tools.sessionRequest({
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: ADMIN_USER,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      USER_RECORDS.admin = body
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

  tape('user routes -> (as admin) get token', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/${USER_RECORDS.admin.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, ADMIN_USER.username, `username correct`)
      t.ok(body.token, `the token is present for reading your own record`)
      USER_TOKENS.admin = body.token
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

  tape('user routes -> list users with no token', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> list users with bad header', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `BearerBad ${USER_TOKENS.admin}`,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 400, `400 code`)
      t.equal(body.error, `bad authorization header format`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> list users with extra header value', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `BearerBad ${USER_TOKENS.admin} bad`,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 400, `400 code`)
      t.equal(body.error, `bad authorization header format`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> list users with bad token', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `Bearer ${USER_TOKENS.admin}bad`,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `access denied`, `correct error`)
      t.end()
    })
    
  })

  tape('user routes -> list users with token', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `Bearer ${USER_TOKENS.admin}`,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.length, 1, `correct number of users`)
      t.end()
    })
    
  })

  tape('user routes -> get user status with token', (t) => {

    tools.sessionRequest({
      method: 'get',
      url: `${url}/user/status`,
      json: true,
      headers: {
        'Authorization': `Bearer ${USER_TOKENS.admin}`,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, ADMIN_USER.username, `username correct`)
      t.end()
    })
    
  })


})