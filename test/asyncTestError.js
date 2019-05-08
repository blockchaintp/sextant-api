const tape = require('tape')

const asyncTestError = (name, handler, cleanup) => {
  tape(name, async (t) => {
    let error = null
    try {
      await handler(t)
    } catch(err) {
      error = err
    }
    t.ok(error, `there was an error`)
    if(cleanup) {
      await cleanup()
    }
    t.end()
  })
}

module.exports = asyncTestError