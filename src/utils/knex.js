'use strict'

const Knex = require('knex')
const settings = require('../settings')

const KnexFactory = (opts) => Knex(settings.postgres)

module.exports = KnexFactory