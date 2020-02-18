/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.createTable('deploymentsecret', (table) => {
      table.specificType('id', 'serial primary key not null')
      table.specificType('created_at', 'timestamp default now()')
      table.integer('deployment')
        .references('id')
        .inTable('deployment')
        .notNullable()
        .onDelete('cascade')
      table.string('name').notNullable()
      table.text('base64data').notNullable()
    })
  ])
}

const down = (knex, Promise) => {
  return Promise.all([
    knex.schema.dropTable('deploymentsecret')
  ])
}

module.exports = {
  up,
  down
}
