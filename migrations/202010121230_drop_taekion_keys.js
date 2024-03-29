const up = (knex) => {
  return Promise.all([
    knex.schema.dropTable('taekionkeys')
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.createTable('taekionkeys', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('deployment')
        .references('id')
        .inTable('deployment')
        .notNullable()
        .onDelete('cascade')
      table.string('name').notNullable()
      table.string('fingerprint').notNullable()
    })
  ])
}

module.exports = {
  up,
  down
}