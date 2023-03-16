/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const up = (knex) => {
  return Promise.all([
    knex.schema.createTable('helmrepository', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.string('name').unique().notNullable()
      table.string('active').defaultTo('true')
      table.string('url').unique().notNullable()
      table.specificType('created_at', 'timestamp default now()')
      table.specificType('updated_at', 'timestamp default now()')
      table.specificType('refreshed_at', 'timestamp')
    }),
  ])
}

const down = (knex) => {
  return Promise.all([knex.schema.dropTable('helmrepository')])
}

module.exports = {
  up,
  down,
}
