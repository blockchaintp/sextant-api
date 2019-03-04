const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('deployment', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('cluster')
        .references('id')
        .inTable('cluster')
        .notNullable()
        .onDelete('cascade')
      table.string('name').unique().notNullable()
      table.enu('status', enumerations.DEPLOYMENT_STATUS).notNullable()
      table.json('desired_state').defaultTo('{}')
      table.json('applied_state').defaultTo('{}')
      table.boolean('maintenance_flag').defaultTo('false')
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('deployment')
  ])
}

module.exports = {
  up,
  down
}