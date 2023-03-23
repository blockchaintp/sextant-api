/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
const enumerations = require('../src/enumerations')

const tableName = 'cluster'

function up(knex) {
  let existRows
  return knex
    .select()
    .from(tableName)
    .then((rows) => {
      existRows = rows
      return knex.schema.table(tableName, (table) => table.dropColumn('provision_type'))
    })
    .then(() =>
      knex.schema.table(tableName, (table) =>
        table.enu('provision_type', enumerations.CLUSTER_PROVISION_TYPE).notNullable()
      )
    )
    .then(() => {
      return Promise.all(
        existRows.map((row) => {
          return knex(tableName).update({ provision_type: row.provision_type }).where('id', row.id)
        })
      )
    })
}

function down(knex) {
  let existRows
  return knex
    .select()
    .from(tableName)
    .then((rows) => {
      existRows = rows
      return knex.schema.table(tableName, (table) => table.dropColumn('service'))
    })
    .then(() =>
      knex.schema.table(tableName, (table) =>
        table
          .enu(
            'provision_type',
            enumerations.CLUSTER_PROVISION_TYPE.filter((x) => x !== 'user')
          )
          .notNullable()
      )
    )
    .then(() => {
      return Promise.all(
        existRows.map((row) => {
          return knex(tableName)
            .update({ cluster: row.provision_type === 'user' ? 'remote' : row.provision_type })
            .where('id', row.id)
        })
      )
    })
}

module.exports = {
  up,
  down,
}
