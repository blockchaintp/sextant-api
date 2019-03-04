'use strict'

const tape = require('tape')
const async = require('async')
const userUtils = require('../../src/utils/user')

tape('user store -> get and compare hash (correct)', (t) => {

  const PASSWORD = 'apples'

  async.waterfall([
    (next) => userUtils.getPasswordHash(PASSWORD, next),
    (hash, next) => userUtils.compareHashedPasswords(PASSWORD, hash, next),
  ], (err, result) => {
    t.notok(err, `there was no error`)
    t.ok(result, `the comparison was correct`)
    t.end()
  })

})

tape('user store -> get and compare hash (incorrect)', (t) => {

  const PASSWORD = 'apples'

  async.waterfall([
    (next) => userUtils.getPasswordHash(PASSWORD, next),
    (hash, next) => userUtils.compareHashedPasswords('oranges', hash, next),
  ], (err, result) => {
    t.notok(err, `there was no error`)
    t.notok(result, `the comparison was not correct`)
    t.end()
  })

})
