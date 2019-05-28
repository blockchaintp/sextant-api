'use strict'

const tape = require('tape')
const Request = require('request')
const request = Request.defaults({jar: true})
const app = require('../app')
const packageJSON = require('../../package.json')
const tools = require('../tools')

app.testSuiteWithApp(({
  getConnection,
  url,
}) => {

  tape('config routes -> get values', (t) => {

    request({
      method: 'get',
      url: `${url}/config/values`,
      json: true,
    }, tools.httpErrorWrapper(t, (err, res, body) => {
      t.equal(res.statusCode, 200, `status 200`)
      t.equal(body.version, packageJSON.version, 'the version is correct')
      t.end()
    }))
    
  })

})