
const up = (knex) => {
  return Promise.all([
    knex.schema.table('task', (table) => {
      table.json('resource_status').defaultTo('{}')
    }),
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('task')
  ])
}

module.exports = {
  up,
  down
}