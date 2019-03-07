'use strict'

const tape = require('tape')
const randomstring = require('randomstring')
const async = require('async')
const userUtils = require('../../src/utils/user')

tape('user utils -> get and compare hash (correct)', (t) => {

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

tape('user utils -> get and compare hash (incorrect)', (t) => {

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

tape('user utils -> get and compare token (correct)', (t) => {

  const USERNAME = 'apples'
  const SECRET = 'oranges'
  let SALT = null

  async.waterfall([
    (next) => userUtils.generateToken(USERNAME, SECRET, (err, generatedToken) => {
      if(err) return next(err)
      SALT = generatedToken.salt
      next(null, generatedToken.token)
    }),
    (token, next) => userUtils.decodeToken(token, SECRET, next),
  ], (err, decoded) => {
    t.notok(err, `there was no error`)
    t.equal(decoded.username, USERNAME, `the username was correct`)
    t.equal(decoded.salt, SALT, `the salt was correct`)
    t.end()
  })

})

tape('user utils -> get and compare token no secret', (t) => {

  const USERNAME = 'apples'
  const SECRET = ''

  async.waterfall([
    (next) => userUtils.generateToken(USERNAME, SECRET, next),
    (token, next) => userUtils.decodeToken(token, SECRET, next),
  ], (err, decoded) => {
    t.ok(err, `there was no error`)
    t.equal(decoded, undefined, `there was no data`)
    t.end()
  })

})

tape('user utils -> get and compare token (incorrect secret)', (t) => {

  const USERNAME = 'apples'
  const SECRET = 'oranges'

  async.waterfall([
    (next) => userUtils.generateToken(USERNAME, SECRET, next),
    (token, next) => userUtils.decodeToken(token, SECRET + 'bad', next),
  ], (err, decoded) => {
    t.ok(err, `there was no error`)
    t.equal(decoded, undefined, `there was no data`)
    t.end()
  })

})

tape('user utils -> get and compare token (incorrect token)', (t) => {

  const USERNAME = 'apples'
  const SECRET = 'oranges'

  async.waterfall([
    (next) => userUtils.generateToken(USERNAME, SECRET, next),
    (token, next) => userUtils.decodeToken(token + 'bad', SECRET, next),
  ], (err, decoded) => {
    t.ok(err, `there was no error`)
    t.equal(decoded, undefined, `there was no data`)
    t.end()
  })

})
