const logger = require('../logging').getLogger({
  name: 'metering/dev',
})

const start = (meteringDetails) => {
  logger.info({
    info: 'There is no metering for dev mode',
    meteringDetails,
  })
}

const stop = () => null

// eslint-disable-next-line no-unused-vars
const isAllowed = (entitlement) => true

// eslint-disable-next-line no-unused-vars
const record = (dimension, value) => null

module.exports = {
  start,
  stop,
  isAllowed,
  record,
}
