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

  tape('cluster routes -> register admin user', (t) => {
    userUtils.registerUser({
      url,
      user: userUtils.USERS.super,
      t,
    }, (err, user) => {
      t.end()
    })
  })

  tape('cluster routes -> login admin user', (t) => {
    userUtils.login({
      url,
      user: userUtils.USERS.super,
      t,
    }, (err, user) => {
      t.end()
    })
  })

  tape('cluster routes -> register normal user', (t) => {
    userUtils.registerUser({
      url,
      user: userUtils.USERS.normal,
      t,
    }, (err, user) => {
      t.end()
    })
  })

  tape('cluster routes -> logout superuser', (t) => {
    userUtils.logout({
      url,
      t,
    }, (err, user) => {
      t.end()
    })
  })

  tape('cluster routes -> login normal user', (t) => {
    userUtils.login({
      url,
      user: userUtils.USERS.normal,
      t,
    }, (err, user) => {
      t.end()
    })
  })

  tape('cluster routes -> logout normal user', (t) => {
    userUtils.logout({
      url,
      t,
    }, (err, user) => {
      t.end()
    })
  })


})