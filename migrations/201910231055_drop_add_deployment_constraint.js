
const up = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.dropUnique('name')
    }),
    knex.schema.alterTable('deployment', (table) => {
      table.unique(['name', 'cluster'])
    })
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.dropUnique(['name','cluster'])
    }),
    knex.schema.alterTable('deployment', (table) => {
      table.unique(['name'])
    })
  ])
}

module.exports = {
  up,
  down
}
