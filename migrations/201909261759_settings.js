const up = (knex) => {
  return Promise.all([
    knex.schema.createTable('settings', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.string('key').notNullable()
      table.text('value').notNullable()
    })
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('settings')
  ])
}

module.exports = {
  up,
  down
}
