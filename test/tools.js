/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

'use strict'

const Promise = require('bluebird')
const request = require('request')

const insertWithMissingValues = async (t, store, baseObject) => {
  const keys = Object.keys(baseObject)
  const errors = await Promise.mapSeries(keys, async field => {
    const data = Object.assign({}, baseObject)
    delete(data[field])
    let error = null
    try {
      await store.create({
        data,
      })
    } catch(err) {
      error = err
    }
    return error
  })

  const actualErrors = errors.filter(err => err)
  t.equal(actualErrors.length, keys.length, `there was an error for each key`)
}

const sessionRequest = (opts, done) => {
  const requestOpts = Object.assign({}, opts, {
    jar: true
  })
  request(requestOpts, httpErrorWrapper(opts.t, done))
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

const httpErrorWrapper = (t, handler) => (err, res, body) => {
  if(err) {
    t.fail(err)
    t.end()
  }
  else {
    handler(err, res, body)
  }
}


module.exports = {
  insertWithMissingValues,
  sessionRequest,
  errorWrapper,
  httpErrorWrapper,
}
