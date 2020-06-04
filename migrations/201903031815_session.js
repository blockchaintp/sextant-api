const SESSION_SQL = `
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
`

const up = (knex) => {
  return Promise.all([
    knex.raw(SESSION_SQL)
  ])
}

const down = (knex) => {
  return Promise.all([
    knex.schema.dropTable('session')
  ])
}

module.exports = {
  up,
  down
}