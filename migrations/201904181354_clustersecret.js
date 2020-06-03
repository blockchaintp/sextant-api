const up = (knex) => {
  return Promise.all([
    knex.schema.createTable('clustersecret', (table) => {
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

const down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('clustersecret')
  ])
}

module.exports = {
  up,
  down
}