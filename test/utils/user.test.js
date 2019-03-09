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

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  async.waterfall([
    (next) => userUtils.getToken(ID, KEY, SECRET, next),
    (token, next) => userUtils.decodeToken(token, SECRET, next),
  ], (err, decoded) => {
    t.notok(err, `there was no error`)
    t.equal(decoded.id, ID, `the username was correct`)
    t.ok(decoded.server_side_key, `there is a server_side_key`)
    t.equal(decoded.server_side_key, KEY, `the server_side_key was correct`)
    t.end()
  })

})

tape('user utils -> get and compare token no secret', (t) => {

  const ID = 10
  const SECRET = ''
  const KEY = userUtils.getTokenServerSideKey()

  async.waterfall([
    (next) => userUtils.getToken(ID, KEY, SECRET, next),
    (token, next) => userUtils.decodeToken(token, SECRET, next),
  ], (err, decoded) => {
    t.ok(err, `there was no error`)
    t.equal(decoded, undefined, `there was no data`)
    t.end()
  })

})

tape('user utils -> get and compare token (incorrect secret)', (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  async.waterfall([
    (next) => userUtils.getToken(ID, KEY, SECRET, next),
    (token, next) => userUtils.decodeToken(token, SECRET + 'bad', next),
  ], (err, decoded) => {
    t.ok(err, `there was no error`)
    t.equal(decoded, undefined, `there was no data`)
    t.end()
  })

})

tape('user utils -> get and compare token (incorrect token)', (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  async.waterfall([
    (next) => userUtils.getToken(ID, KEY, SECRET, next),
    (token, next) => userUtils.decodeToken(token + 'bad', SECRET, next),
  ], (err, decoded) => {
    t.ok(err, `there was no error`)
    t.equal(decoded, undefined, `there was no data`)
    t.end()
  })

})

tape('user utils -> check tokens are generated the same way twice', (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  userUtils.getToken(ID, KEY, SECRET, (err, firstToken) => {
    t.notok(err, `there was no initial error`)

    userUtils.getToken(ID, KEY, SECRET, (err, secondToken) => {
      t.notok(err, `there was no initial error`)
      t.equal(firstToken, secondToken, `the two tokens are the same`)
      t.end()
    })
  })
})
