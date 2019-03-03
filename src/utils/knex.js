'use strict'

const Knex = require('knex')
const settings = require('../settings')

const KnexFactory = () => Knex(settings.postgres)

module.exports = KnexFactory