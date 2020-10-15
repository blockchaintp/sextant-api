'use strict'

const tape = require('tape')
const Request = require('request')
const async = require('async')
const request = Request.defaults({jar: true})
const app = require('../app')
const packageJSON = require('../../package.json')
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

  tape('config routes -> test no user', (t) => {

    request({
      method: 'get',
      url: `${url}/config/values`,
      json: true,
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.equal(res.statusCode, 403, `status 403`)
      t.end()
    }))
    
  })

  tape('config routes -> test logged in user', (t) => {

    async.series([
      next => {
        tools.sessionRequest({
          t,
          method: 'post',
          url: `${url}/user`,
          json: true,
          body: SUPER_USER,
        }, (err, res, body) => {
          next(err)          
        })
      },

      next => {
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
          next(err)
        })
      },

      next => {
        tools.sessionRequest({
          t,
          method: 'get',
          url: `${url}/config/values`,
          json: true,
        }, (err, res, body) => {
          if(err) return next(err)
          t.equal(res.statusCode, 200, `status 200`)
          t.equal(body.version, packageJSON.version, 'the version is correct')
          next()
        })
      },

      next => {
        tools.sessionRequest({
          t,
          method: 'post',
          url: `${url}/user`,
          json: true,
          body: NORMAL_USER,
        }, (err, res, body) => {
          if(err) return next(err)
          USER_RECORDS.normal = body
          next()
        })
      },

      next => {
        tools.sessionRequest({
          t,
          method: 'get',
          url: `${url}/user/logout`,
          json: true,
        }, (err, res, body) => {
          next(err)
        })
      },

      next => {
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
          next(err)
        })
      },

      next => {
        tools.sessionRequest({
          t,
          method: 'get',
          url: `${url}/config/values`,
          json: true,
        }, (err, res, body) => {
          if(err) return next(err)
          t.equal(res.statusCode, 200, `status 200`)
          t.equal(body.version, packageJSON.version, 'the version is correct')
          next()
        })
      },
    ], err => {
      t.notok(err, `there is no error`)
      t.end()
    })
  })

})