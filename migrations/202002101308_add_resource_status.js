
const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.table('task', (table) => {
      table.json('resource_status').defaultTo('{}')
    }),
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