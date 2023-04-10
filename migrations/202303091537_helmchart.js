/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
const up = (knex) => {
  return Promise.all([
    knex.schema.createTable('helmchart', (table) => {
      table.boolean('active').defaultTo('true').notNullable()
      table.string('app_version').notNullable()
      table.specificType('created_at', 'timestamp default now()')
      table.string('description').notNullable()
      table.string('digest').notNullable()
      table.string('icon')
      table.specificType('id', 'serial primary key not null')
      table.string('keywords')
      table.string('kube_version')
      table.string('name').unique().notNullable()
      table.specificType('refreshed_at', 'timestamp')
      table.specificType('repository_id', 'integer references helmrepository(id)')
      table.specificType('updated_at', 'timestamp default now()')
      table.boolean('verified').defaultTo(false).notNullable()
      table.string('version').notNullable()
    }),
  ])
}

const down = (knex) => {
  return Promise.all([knex.schema.dropTable('helmchart')])
}

module.exports = {
  up,
  down,
}
