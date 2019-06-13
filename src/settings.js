const config = require('./config')
const required_env = [
  'POSTGRES_SERVICE_HOST',
  'POSTGRES_USER',
  'POSTGRES_DB',
  'POSTGRES_PASSWORD',
  'SESSION_SECRET',
  'TOKEN_SECRET',
]

const missing_env = required_env.filter(name => process.env[name] ? false : true)

if(missing_env.length>0) {
  console.error(`The following environment variables are required:

${missing_env.join("\n")}
`)

  process.exit(1)
}

/*

  the settings passed in via the command line or environment
  
*/
const args = require('minimist')(process.argv, {
  alias: {
    'initial-user': 'initialUser',
    'initial-password': 'initialPassword',
  },
  default:{
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || config.baseUrl,

    // turn logging on?
    logging: process.env.LOGGING,

    // postgres
    postgreshost: process.env.POSTGRES_SERVICE_HOST,
    postgresport: process.env.POSTGRES_SERVICE_PORT || 5432,
    postgresuser: process.env.POSTGRES_USER,
    postgrespassword: process.env.POSTGRES_PASSWORD,
    postgresdatabase: process.env.POSTGRES_DB,
    postgrestls: process.env.POSTGRES_TLS,

    // sessions
    sessionSecret: process.env.SESSION_SECRET,
    tokenSecret: process.env.TOKEN_SECRET,

    // the name of the initial root user to create if it doesn't exist
    initialUser: process.env.INITIAL_USER,

    // the passworod of the initial user to create if it doesn't exist
    initialPassword: process.env.INITIAL_PASSWORD,

  }
})

args.postgres = {
  client: 'pg',
  connection: {
    host: args.postgreshost,
    port: args.postgresport,
    user: args.postgresuser,
    password: args.postgrespassword,
    database: args.postgresdatabase,
    ssl: args.postgrestls ? true : false
  },
  pool: {
    min: 2,
    max: 10
  }
}

module.exports = args