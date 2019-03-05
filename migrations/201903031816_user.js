const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('user', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.string('username').unique().notNullable()
      table.string('hashed_password').notNullable()
      table.enu('role', enumerations.PERMISSION_ROLE).notNullable()
      table.json('meta').defaultTo('{}')
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('user')
  ])
}

module.exports = {
  up,
  down
}