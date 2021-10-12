const up = (knex) => Promise.all([
  knex.schema.createTable('deployment_history', (table) => {
    table.specificType('recorded_at', 'timestamp default now()')
    table.integer('cluster_id')
    table.integer('deployment_id')
    table.string('name')
    table.string('deployment_type')
    table.string('deployment_version')
    table.string('status')
    table.json('helm_response').defaultTo('{}')
  }),
])

const down = (knex) => Promise.all([
  knex.schema.dropTable('deployment_history'),
])

module.exports = {
  up,
  down,
}
