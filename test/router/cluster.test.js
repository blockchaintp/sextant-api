'use strict'

const tape = require('tape')
const async = require('async')
const app = require('../app')
const tools = require('../tools')

const config = require('../../src/config')

const userUtils = require('./userUtils')

const {
  PERMISSION_USER,
} = config

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


})