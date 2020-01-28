
const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.text('custom_yaml').defaultTo('')
    }),
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