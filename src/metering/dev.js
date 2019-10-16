'use strict'

const pino = require('pino')({
  name: 'metering.ecs',
})


const start = (meteringDetails) => {
  pino.info({
    info: "There is no metering for dev mode"
  })
}

const stop = () => {
  return null
}

const isAllowed = (entitlement) => {
  return true
}

const record = (dimension, value) => {
  return null
}


module.exports = {
  start,
  stop,
  isAllowed,
  record
}
