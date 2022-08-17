/* eslint-disable import/prefer-default-export */
// Edition object for community edition (sawtooth+DAML)
import { BTP_STABLE, STABLE_CHARTS } from './charts/repositories'
import DEPLOYMENT_SPEC from './deployment'
import METERING from './metering/metering'
import { SextantEdition } from './types'

export const edition: SextantEdition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [BTP_STABLE],
  chartTable: {
    besu: {
      1.4: {
        ...STABLE_CHARTS.BESU,
        order: 1,
      },
    },
    sawtooth: {
      1.1: {
        ...STABLE_CHARTS.SAWTOOTH,
        order: 2,
      },
    },
    'daml-on-besu': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_BESU,
        order: 3,
      },
    },
    'daml-on-sawtooth': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_SAWTOOTH,
        order: 4,
      },
    },
  },
}
