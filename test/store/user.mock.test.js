'use strict'

const tape = require('tape')
const MockStore = require('../../src/store/mock/user')

const SIMPLE_USER_DATA = {
  1: {
    id: 1,
    username: 'zebra',
  },
  2: {
    id: 2,
    username: 'apples',
  }
}

const getMockStore = (data) => MockStore(JSON.parse(JSON.stringify(data || ''))) 

tape('user store -> list no data', (t) => {

  const store = getMockStore()

  store.list({}, (err, users) => {
    t.notok(err, `there was no error`)
    t.equal(users.length, 0, `there were no users`)
    t.end()
  })
  
})

tape('user store -> list with order', (t) => {

  const store = getMockStore(SIMPLE_USER_DATA)

  store.list({}, (err, users) => {
    t.notok(err, `there was no error`)
    t.equal(users.length, 2, `there were 2 users`)
    t.deepEqual(users.map(user => user.username), [
      'apples',
      'zebra',
    ], 'the users were in the correct order')
    t.end()
  })
  
})

tape('user store -> get user', (t) => {

  const store = getMockStore(SIMPLE_USER_DATA)

  store.get({
    id: 2,
  }, (err, user) => {
    t.notok(err, `there was no error`)
    t.deepEqual(user, SIMPLE_USER_DATA["2"], 'the user data was correct')
    t.end()
  })
  
})

tape('user store -> add user', (t) => {

  const store = getMockStore(SIMPLE_USER_DATA)

  store.add({
    data: {
      username: 'oranges',
    }
  }, (err, user) => {
    t.notok(err, `there was no error`)
    t.equal(user.username, 'oranges', `the returned user username is correct`)
    t.equal(user.id, 3, `the returned user id is correct`)
    store.list({}, (err, users) => {
      t.notok(err, `there was no error`)
      t.equal(users.length, 3, `there are 3 users`)
      t.end()
    })
  })
  
})