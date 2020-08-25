
const up = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.text('custom_yaml').defaultTo('')
    }),
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.dropColumn('custom_yaml')
    })
  ]);
}

module.exports = {
  up,
  down
}