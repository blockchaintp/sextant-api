
/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const up = (knex, Promise) => {
  return Promise.all([
    knex.schema.table('deployment', (table) => {
      table.dropUnique('name')
    }),
    knex.schema.alterTable('deployment', (table) => {
      table.unique(['name', 'cluster'])
    })
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
