const tape = require('tape')

const asyncTest = (name, handler, cleanup) => {
  tape(name, async (t) => {
    try {
      await handler(t)
      t.pass('there was no error')
    } catch (err) {
      t.fail(err)
      console.log(err.stack)
    }
    if (cleanup) {
      await cleanup()
    }
    t.end()
  })
}

module.exports = asyncTest
