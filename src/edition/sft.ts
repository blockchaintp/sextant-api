/* eslint-disable import/prefer-default-export */
// Edition object for SFT editions (sawtooth+TFS)
import { BTP_UNSTABLE, UNSTABLE_CHARTS } from './charts/repositories'
import { EMPTY } from './deployment'
import METERING from './metering/metering'

export const edition = {
  deployment: EMPTY,
  metering: METERING.DEV,
  helmRepos: [BTP_UNSTABLE],
  chartTable: {
    sawtooth: {
      1.1: {
        ...UNSTABLE_CHARTS.SAWTOOTH,
        order: 2,
      },
    },
    'tfs-on-sawtooth': {
      0.1: {
        ...UNSTABLE_CHARTS.TFS_ON_SAWTOOTH,
        order: 1,
      },
    },
    'nginx-ingress': {
      1.8: {
        ...UNSTABLE_CHARTS.NGINX_INGRESS,
        order: 3,
      },
    },
  },
}
