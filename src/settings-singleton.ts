/* eslint-disable no-underscore-dangle */
import minimist from 'minimist'
import { baseUrl } from './config'

const requiredEnv = ['POSTGRES_SERVICE_HOST', 'POSTGRES_USER', 'POSTGRES_DB', 'POSTGRES_PASSWORD']

const argSpec: {
  [key: string]: { [key: string]: string | number }
} = {
  alias: {
    'initial-user': 'initialUser',
    'initial-password': 'initialPassword',
  },
  default: {
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || baseUrl,

    // turn logging on?
    logging: process.env.LOGGING || 'on',

    // postgres
    postgreshost: process.env.POSTGRES_SERVICE_HOST || 'localhost',
    postgresport: process.env.POSTGRES_SERVICE_PORT || 5432,
    postgresuser: process.env.POSTGRES_USER || 'noone',
    postgrespassword: process.env.POSTGRES_PASSWORD || 'nopassword',
    postgresdatabase: process.env.POSTGRES_DB || 'postgres',
    postgrestls: process.env.POSTGRES_TLS || 'false',

    // sessions
    sessionSecret: 'unset',
    tokenSecret: 'unset',

    // the name of the initial root user to create if it doesn't exist
    initialUser: process.env.INITIAL_USER || '',

    // the password of the initial user to create if it doesn't exist
    initialPassword: process.env.INITIAL_PASSWORD || '',

    startTime: Date.now(),
  },
}

type PostgresSettings = {
  client: 'pg'
  connection: {
    database: string
    host: string
    password: string
    port: number
    ssl: boolean
    user: string
  }
  pool: {
    max: number
    min: number
  }
}

export interface Settings {
  readonly baseUrl: string
  readonly initialPassword: string
  readonly initialUser: string
  readonly logging: string
  readonly port: number
  readonly postgres: PostgresSettings
  sessionSecret: string
  readonly startTime: number
  tokenSecret: string
}

export class SettingsSingleton implements Settings {
  private static _instance: Settings

  public readonly baseUrl: string
  public readonly initialPassword: string
  public readonly initialUser: string
  public readonly logging: string
  public readonly port: number
  public readonly postgres: PostgresSettings
  public sessionSecret: string
  public readonly startTime: number
  public tokenSecret: string

  private constructor() {
    const missingEnv = requiredEnv.filter((name) => !process.env[name])
    if (missingEnv.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnv.join(', ')}`)
    }
    const parsedArgs = minimist(process.argv.slice(2), argSpec)
    this.postgres = {
      client: 'pg',
      connection: {
        database: parsedArgs.postgresdatabase as string,
        host: parsedArgs.postgreshost as string,
        password: parsedArgs.postgrespassword as string,
        port: parsedArgs.postgresport as number,
        ssl: parsedArgs.postgrestls === 'true' ? true : false,
        user: parsedArgs.postgresuser as string,
      },
      pool: {
        max: 10,
        min: 2,
      },
    }
    this.port = parsedArgs.port as number
    this.baseUrl = parsedArgs.baseUrl as string
    this.logging = parsedArgs.logging as string
    this.sessionSecret = parsedArgs.sessionSecret as string
    this.tokenSecret = parsedArgs.tokenSecret as string
    this.initialUser = parsedArgs.initialUser as string
    this.initialPassword = parsedArgs.initialPassword as string
    this.startTime = Date.now()
  }

  public static getInstance(): Settings {
    if (!SettingsSingleton._instance) {
      SettingsSingleton._instance = new SettingsSingleton()
    }
    return SettingsSingleton._instance
  }
}
