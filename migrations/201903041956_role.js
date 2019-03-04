const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('role', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('user')
        .references('id')
        .inTable('user')
        .notNullable()
        .onDelete('cascade')
      table.enu('permission', enumerations.PERMISSION_ROLE, {
        useNative: true,
        enumName: 'PERMISSION_ROLE',
      }).notNullable()
      table.integer('cluster')
        .references('id')
        .inTable('cluster')
        .onDelete('cascade')
      table.integer('deployment')
        .references('id')
        .inTable('deployment')
        .onDelete('cascade')
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('role')
  ])
}

module.exports = {
  up,
  down
}