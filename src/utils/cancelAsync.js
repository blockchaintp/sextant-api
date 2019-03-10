const async = require('async')

// wrap a standard async.series sequence
// with a check for if the task has been cancelled for each step
const series = (checkCancelStatus) => (fns, done) => {
  const newFns = fns.map(fn => {
    return (next) => {
      checkCancelStatus((err, cancelled) => {
        // the task has been cancelled - do nothing from here
        if(cancelled) return
        fn(next)
      })
    }
  })
  async.series(newFns, done)
}

// wrap a standard async.waterfall sequence
// with a check for if the task has been cancelled for each step
// NOTE: this only works passing a single value onto the next function
// so - next(null, 10, 20) would not work
const waterfall = (checkCancelStatus) => (fns, done) => {
  const newFns = fns.map(fn => {
    return (prev, next) => {
      checkCancelStatus((err, cancelled) => {
        // the task has been cancelled - do nothing from here
        if(cancelled) return
        if(prev) fn(prev, next)
        else fn(next)
      })
    }
  })
  async.waterfall(newFns, done)
}

module.exports = {
  series,
  waterfall,
}