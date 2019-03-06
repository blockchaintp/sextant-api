'use strict'

const tape = require('tape')
const request = require('request')
const app = require('../app')
const packageJSON = require('../../package.json')

app.testSuiteWithApp(({
  getConnection,
  url,
}) => {

  tape('config routes -> get version', (t) => {

    request({
      method: 'get',
      url: `${url}/config/version`,
      json: true,
    }, (err, res, body) => {
      t.notok(err, `there is no error`)
      t.equal(res.statusCode, 200, `status 200`)
      t.equal(body.version, packageJSON.version, 'the version is correct')
      t.end()
    })
    
  })

})