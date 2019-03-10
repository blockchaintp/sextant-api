'use strict'

const tape = require('tape')
const cancelAsync = require('../../src/utils/cancelAsync')

tape('cancel async -> series no cancel', (t) => {

  const stepsSeen = {
    first: false,
    second: false,
  }

  const checkCancelStatus = (done) => done(null, false)
  const cancelSeries = cancelAsync.series(checkCancelStatus)

  cancelSeries([
    next => {
      stepsSeen.first = true
      next()
    },

    next => {
      stepsSeen.second = true
      next()
    }
  ], () => {
    t.ok(stepsSeen.first, `the first step was seen`)
    t.ok(stepsSeen.second, `the second step was seen`)
    t.end()
  })
})

tape('cancel async -> series with cancel', (t) => {

  const stepsSeen = {
    first: false,
    second: false,
  }

  const checkCancelStatus = (done) => done(null, stepsSeen.first)
  const cancelSeries = cancelAsync.series(checkCancelStatus)

  cancelSeries([
    next => {
      stepsSeen.first = true
      next()
    },

    next => {
      // we should never get here
      t.error(`the second stage was called and should have been cancelled`)
      stepsSeen.second = true
      next()
    }
  ], () => {
    t.error(`the callback was called and should have been cancelled`)
  })

  setTimeout(() => {
    t.ok(stepsSeen.first, `the first step was seen`)
    t.notok(stepsSeen.second, `the second step was not seen`)
    t.end()
  }, 100)
})

tape('cancel waterfall -> waterfall no cancel', (t) => {

  const stepsSeen = {
    first: false,
    second: false,
  }

  const checkCancelStatus = (done) => done(null, false)
  const cancelSeries = cancelAsync.waterfall(checkCancelStatus)

  cancelSeries([
    (next) => {
      stepsSeen.first = true
      next(null, 10)
    },

    (prev, next) => {
      t.equal(prev, 10, `the previous value was passed on`)
      stepsSeen.second = true
      next()
    },

  ], () => {
    t.ok(stepsSeen.first, `the first step was seen`)
    t.ok(stepsSeen.second, `the second step was seen`)
    t.end()
  })
})

tape('cancel waterfall -> waterfall with cancel', (t) => {

  const stepsSeen = {
    first: false,
    second: false,
    third: false,
  }

  const checkCancelStatus = (done) => done(null, stepsSeen.second)
  const cancelSeries = cancelAsync.waterfall(checkCancelStatus)

  cancelSeries([
    (next) => {
      stepsSeen.first = true
      next(null, 10)
    },

    (prev, next) => {
      t.equal(prev, 10, `the previous value was passed on`)
      stepsSeen.second = true
      next(null, 20)
    },

    (prev, next) => {
      t.error(`the third stage was called and should have been cancelled`)
      stepsSeen.third = true
      next()
    },

  ], () => {
    t.error(`the callback was called and should have been cancelled`)
  })

  setTimeout(() => {
    t.ok(stepsSeen.first, `the first step was seen`)
    t.ok(stepsSeen.second, `the second step was seen`)
    t.notok(stepsSeen.third, `the third step was not seen`)
    t.end()
  }, 100)
})
