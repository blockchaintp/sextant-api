'use strict'

const tape = require('tape')
const request = require('request')
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

  const USER_DATA = {
    username: 'superuser',
    password: 'apples',
    permission: USER_TYPES.superuser,
  }

  let USER_RECORD = null
  let USER_TOKEN = null

  tape('user token routes -> register user', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user`,
      json: true,
      body: USER_DATA,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 201, `201 code`)
      USER_RECORD = body
      t.end()
    })
    
  })

  tape('user token routes -> login', (t) => {

    tools.sessionRequest({
      t,
      method: 'post',
      url: `${url}/user/login`,
      json: true,
      body: {
        username: USER_DATA.username,
        password: USER_DATA.password,
      },
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.ok, true, 'result was ok')
      t.end()
    })
    
  })

  tape('user token routes -> get', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/${USER_RECORD.id}`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, USER_DATA.username, `username correct`)
      t.end()
    })
    
  })

  tape('user token routes -> (as admin) get token', (t) => {

    tools.sessionRequest({
      t,
      method: 'get',
      url: `${url}/user/${USER_RECORD.id}/token`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.ok(body.token, `the token is present for reading your own record`)
      USER_TOKEN = body.token
      t.end()
    })
    
  })

  tape('user token routes -> logout', (t) => {

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

  tape('user token routes -> list users with no token', (t) => {

    request({
      method: 'get',
      url: `${url}/user`,
      json: true,
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.equal(res.statusCode, 403, `403 code`)
      t.equal(body.error, `Error: access denied`, `correct error`)
      t.end()
    }))
    
  })

  tape('user token routes -> list users with bad header', (t) => {

    request({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `BearerBad ${USER_TOKEN}`,
      },
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 400, `400 code`)
      t.equal(body.error, `Error: bad authorization header format`, `correct error`)
      t.end()
    }))
    
  })

  tape('user token routes -> list users with extra header value', (t) => {

    request({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `BearerBad ${USER_TOKEN} bad`,
      },
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 400, `400 code`)
      t.equal(body.error, `Error: bad authorization header format`, `correct error`)
      t.end()
    }))
    
  })

  tape('user token routes -> list users with bad token', (t) => {

    request({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}bad`,
      },
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 500, `500 code`)
      t.equal(body.error, `JsonWebTokenError: invalid signature`, `correct error`)
      t.end()
    }))
    
  })

  tape('user token routes -> list users with token', (t) => {

    request({
      method: 'get',
      url: `${url}/user`,
      json: true,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
      },
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 code`)
      t.equal(body.length, 1, `correct number of users`)
      t.end()
    }))
    
  })

  tape('user token routes -> get user status with token', (t) => {

    request({
      method: 'get',
      url: `${url}/user/status`,
      json: true,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
      },
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `200 status`)
      t.equal(body.username, USER_DATA.username, `username correct`)
      t.end()
    }))
    
  })


})