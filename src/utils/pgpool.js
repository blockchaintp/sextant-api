'use strict'

const pg = require('pg')
const settings = require('../settings')

const PGPoolFactory = () => {
  return new pg.Pool(settings.postgres.connection)
}

module.exports = PGPoolFactory