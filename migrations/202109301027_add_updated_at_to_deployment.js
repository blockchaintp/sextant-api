const up = (knex) => Promise.all([
  knex.schema.table('deployment', (table) => {
    table.specificType('updated_at', 'timestamp default now()')
  }),
])

const down = (knex) => Promise.all([
  knex.schema.table('deployment', (table) => {
    table.dropColumn('updated_at')
  }),
])

module.exports = {
  up,
  down,
}
