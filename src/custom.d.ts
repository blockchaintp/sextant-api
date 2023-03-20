/**
 * This file declares custom extensions to third party types.
 */

import EventEmitter from 'events'

export {}

declare global {
  namespace Express {
    interface Response {
      _code?: number
    }
    interface Application {
      taskProcessor: EventEmitter
    }
  }
}
