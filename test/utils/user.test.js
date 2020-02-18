/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'

const userUtils = require('../../src/utils/user')
const asyncTest = require('../asyncTest')

asyncTest('user utils -> get and compare hash (correct)', async (t) => {
  const PASSWORD = 'apples'
  const hash = await userUtils.getPasswordHash(PASSWORD)
  const result = await userUtils.compareHashedPasswords(PASSWORD, hash)
  t.ok(result, `the comparison was correct`)
})

asyncTest('user utils -> get and compare hash (incorrect)', async (t) => {
  const PASSWORD = 'apples'
  const hash = await userUtils.getPasswordHash(PASSWORD)
  const result = await userUtils.compareHashedPasswords('oranges', hash)
  t.notok(result, `the comparison was not correct`)
})

asyncTest('user utils -> get and compare token (correct)', async (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  const token = await userUtils.getToken(ID, KEY, SECRET)
  const decoded = await userUtils.decodeToken(token, SECRET)

  t.equal(decoded.id, ID, `the username was correct`)
  t.ok(decoded.server_side_key, `there is a server_side_key`)
  t.equal(decoded.server_side_key, KEY, `the server_side_key was correct`)
})

asyncTest('user utils -> get and compare token no secret', async (t) => {

  const ID = 10
  const SECRET = ''
  const KEY = userUtils.getTokenServerSideKey()

  let error = null
  let decoded = null

  try {
    const token = await userUtils.getToken(ID, KEY, SECRET)
    decoded = await userUtils.decodeToken(token, SECRET)
  } catch(err) {
    error = err
  }

  t.ok(error, `there was an error`)
  t.equal(decoded, null, `there was no data`)
})

asyncTest('user utils -> get and compare token (incorrect secret)', async (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  let error = null
  let decoded = null

  try {
    const token = await userUtils.getToken(ID, KEY, SECRET)
    decoded = await userUtils.decodeToken(token, SECRET + 'bad')
  } catch(err) {
    error = err
  }

  t.ok(error, `there was an error`)
  t.equal(decoded, null, `there was no data`)
})

asyncTest('user utils -> get and compare token (incorrect token)', async (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  let error = null
  let decoded = null

  try {
    const token = await userUtils.getToken(ID, KEY, SECRET)
    decoded = await userUtils.decodeToken(token + 'bad', SECRET)
  } catch(err) {
    error = err
  }

  t.ok(error, `there was an error`)
  t.equal(decoded, null, `there was no data`)
})

asyncTest('user utils -> check tokens are generated the same way twice', async (t) => {

  const ID = 10
  const SECRET = 'oranges'
  const KEY = userUtils.getTokenServerSideKey()

  const firstToken = await userUtils.getToken(ID, KEY, SECRET)
  const secondToken = await userUtils.getToken(ID, KEY, SECRET)
  t.equal(firstToken, secondToken, `the two tokens are the same`)
})
