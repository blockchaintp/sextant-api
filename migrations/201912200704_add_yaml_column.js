
const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.string('custom_yaml').defaultTo('')
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