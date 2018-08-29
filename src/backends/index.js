'use strict'

const ConfigBackend = require('./config')

const Backends = () => {

  const config = ConfigBackend()
  
  return {
    config,
  }
}

module.exports = Backends