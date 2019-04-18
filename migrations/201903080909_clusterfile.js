const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('clusterfile', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('cluster')
        .references('id')
        .inTable('cluster')
        .notNullable()
        .onDelete('cascade')
      table.string('name').notNullable()
      table.text('base64data').notNullable()
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('clusterfile')
  ])
}

module.exports = {
  up,
  down
}