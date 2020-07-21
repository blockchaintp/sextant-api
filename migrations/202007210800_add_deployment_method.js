
const up = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.text('deployment_method').defaultTo('classic')
    }),
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('deployment')
  ])
}

module.exports = {
  up,
  down
}