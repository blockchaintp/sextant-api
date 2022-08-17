import { MeteringSpec } from './types'

const METERING: {
  [key: string]: MeteringSpec<unknown>
} = {
  DEV: {
    type: 'dev',
  },
}

export default METERING
