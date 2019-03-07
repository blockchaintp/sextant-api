const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('task', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('user')
        .references('id')
        .inTable('useraccount')
        .notNullable()
      table.enu('status', enumerations.TASK_STATUS).notNullable()
      table.enu('resource_type', enumerations.RESOURCE_TYPES).notNullable()
      table.integer('resource_id')
        .notNullable()
      table.boolean('restartable').notNullable()
      table.json('payload')
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('task')
  ])
}

module.exports = {
  up,
  down
}