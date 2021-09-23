const pino = require('pino')

const rootLogger = pino({
  name: 'root',
  level: process.env.LOG_LEVEL || 'info',
})

const getLogger = (options) => rootLogger.child(options)

module.exports = {
  getLogger,
  rootLogger,
}
