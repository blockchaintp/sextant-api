const config = require('../src/config')
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
      table.enu('status', enumerations.TASK_STATUS).notNullable().defaultTo(config.TASK_STATUS_DEFAULT)
      table.enu('resource_type', enumerations.RESOURCE_TYPES).notNullable()
      table.enu('action', enumerations.TASK_ACTION).notNullable()
      table.integer('resource_id')
        .notNullable()
      table.boolean('restartable').notNullable()
      table.json('payload').defaultTo('{}')
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