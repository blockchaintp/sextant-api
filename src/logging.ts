/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as pino from 'pino'

export const rootLogger = pino({
  name: 'root',
  level: process.env.LOG_LEVEL || 'info',
})

export const getLogger = (options) => rootLogger.child(options)
