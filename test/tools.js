'use strict'

const request = require('request')
const async = require('async')

const insertWithMissingValues = (t, store, baseObject) => {
  async.eachSeries(Object.keys(baseObject), (field, nextField) => {
    const insertData = Object.assign({}, baseObject)
    delete(insertData[field])
    store.create({
      data: insertData
    }, (err) => {
      t.ok(err, `there was an error for missing field: ${field}`)
      nextField()
    })
  }, (err) => {
    t.notok(err, `there was no error`)
    t.end()
  })
}

const sessionRequest = (opts, done) => {
  const requestOpts = Object.assign({}, opts, {
    jar: true
  })
  request(requestOpts, done)
}

const errorWrapper = (t, handler) => (err, result) => {
  if(err) {
    t.fail(err)
    t.end()
  }
  else {
    handler(result)
  }
}

module.exports = {
  insertWithMissingValues,
  sessionRequest,
  errorWrapper,
}