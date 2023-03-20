export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASE_URL?: string
      INITIAL_PASSWORD?: string
      INITIAL_USER?: string
      LOGGING?: string
      POSTGRES_DB?: string
      POSTGRES_PASSWORD?: string
      POSTGRES_SERVICE_HOST?: string
      POSTGRES_SERVICE_PORT?: string
      POSTGRES_TLS?: string
      POSTGRES_USER?: string
    }
  }
}
