const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('useraccount', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.string('username').unique().notNullable()
      table.string('hashed_password').notNullable()
      // todo: we don't need this
      table.string('token').notNullable()
      // todo: change this to server_side_key
      table.string('token_salt').notNullable()
      table.enu('role', enumerations.PERMISSION_ROLE).notNullable()
      table.json('meta').defaultTo('{}')
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('useraccount')
  ])
}

module.exports = {
  up,
  down
}