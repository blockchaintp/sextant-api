const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('useraccount', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.string('username').unique().notNullable()
      table.string('hashed_password').notNullable()
      table.string('server_side_key').notNullable()
      table.enu('permission', enumerations.PERMISSION_USER).notNullable()
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