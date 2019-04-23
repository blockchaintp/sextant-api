'use strict'

const tape = require('tape')
const async = require('async')
const app = require('../app')
const tools = require('../tools')

const config = require('../../src/config')

const userUtils = require('./userUtils')

app.testSuiteWithApp(({
  getConnection,
  url,
}) => {

  tape('cluster routes -> setup users', (t) => {
    userUtils.setupUsers({
      url,
      t,
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> list clusters as superuser', (t) => {
    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.superuser,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'get',
        url: `${url}/clusters`,
        json: true,
      }, (err, res, body) => {
        t.notok(err, `there is no error`)
        t.equal(res.statusCode, 200, `200 code`)
        t.deepEqual(body, [], `the body is an empty list of clusters`)
        next()
      })
    },
    (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

})