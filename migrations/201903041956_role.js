const enumerations = require('../src/enumerations')

const up = (knex) => {
  return Promise.all([
    knex.schema.createTable('role', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('user')
        .references('id')
        .inTable('useraccount')
        .notNullable()
        .onDelete('cascade')
      table.enu('permission', enumerations.PERMISSION_TYPES).notNullable()
      table.enu('resource_type', enumerations.RESOURCE_TYPES).notNullable()
      table.integer('resource_id')
        .notNullable()
    })
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('role')
  ])
}

module.exports = {
  up,
  down
}