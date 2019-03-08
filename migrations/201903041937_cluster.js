const enumerations = require('../src/enumerations')

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('cluster', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.string('name').unique().notNullable()
      table.enu('provision_type', enumerations.CLUSTER_PROVISION_TYPE).notNullable()
      table.enu('status', enumerations.CLUSTER_STATUS).notNullable().defaultTo(enumerations.CLUSTER_STATUS_DEFAULT)
      table.json('capabilities').defaultTo('{}')
      table.json('desired_state').defaultTo('{}')
      table.json('applied_state').defaultTo('{}')
      table.boolean('maintenance_flag').defaultTo('false')
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('cluster')
  ])
}

module.exports = {
  up,
  down
}