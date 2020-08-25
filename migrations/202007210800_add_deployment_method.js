
const up = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.text('deployment_method').defaultTo('classic')
    }),
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.dropColumn('deployment_method')
    }),
  ])
}

module.exports = {
  up,
  down
}