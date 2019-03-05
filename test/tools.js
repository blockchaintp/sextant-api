'use strict'

const async = require('async')

const insertWithMissingValues = (t, store, baseObject) => {
  async.eachSeries(Object.keys(baseObject), (field, nextField) => {
    const insertData = Object.assign({}, baseObject)
    delete(insertData[field])
    store.create(insertData, (err) => {
      t.ok(err, `there was an error for missing field: ${field}`)
      nextField()
    })
  }, (err) => {
    t.notok(err, `there was no error`)
    t.end()
  })
}

module.exports = {
  insertWithMissingValues,
}