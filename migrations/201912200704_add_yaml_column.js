
const up = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.text('custom_yaml').defaultTo('')
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