'use strict'

const tape = require('tape')
const Store = require('../../src/store/postgres/user')
const utils = require('./utils')

const databaseName = `testdb${new Date().getTime()}`

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

let databaseConnection = null

tape('user store -> setup database', (t) => {

  utils.createTestKnex(databaseName, (err, knex) => {
    t.notok(err, `there was no error`)
    databaseConnection = knex
    t.end()
  })

})

tape('user store -> teardown database', (t) => {

  databaseConnection
    .destroy()
    .then(() => {
      utils.destroyTestKnex(databaseName, (err, knex) => {
        t.notok(err, `there was no error`)
        t.end()
      })
    })
    .catch(err => {
      t.error(err)
      t.end()
    })
})
