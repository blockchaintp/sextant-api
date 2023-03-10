import { pino } from 'pino'

export const rootLogger = pino({
  name: 'root',
  level: process.env.LOG_LEVEL || 'info',
})

export const getLogger = (options: pino.Bindings): pino.Logger => rootLogger.child(options)
