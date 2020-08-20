const enumerations = require('../src/enumerations')

const formatAlterTableEnumSql = (
  tableName,
  columnName,
  enums,
) => {
  const constraintName = `${tableName}_${columnName}_check`;
  return [
    `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintName};`,
    `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} CHECK (${columnName} = ANY (ARRAY['${enums.join(
      "'::text, '"
    )}'::text]));`,
  ].join('\n');
};


exports.up = async function up(knex) {
  await knex.raw(
    formatAlterTableEnumSql('deployment', 'deployment_type', enumerations.DEPLOYMENT_TYPE)
  );
};

exports.down = async function down(knex) {
  
};
