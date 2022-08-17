/* eslint-disable import/prefer-default-export */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for Sawtooth
import { BTP_STABLE, STABLE_CHARTS } from './charts/repositories'
import DEPLOYMENT_SPEC from './deployment'
import METERING from './metering/metering'
import { SextantEdition } from './types'

export const edition: SextantEdition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [BTP_STABLE],
  chartTable: {
    sawtooth: {
      1.1: {
        ...STABLE_CHARTS.SAWTOOTH,
        order: 1,
      },
    },
    openebs: {
      '2.0': {
        ...STABLE_CHARTS.OPENEBS,
        order: 4,
      },
    },
    'nginx-ingress': {
      1.8: {
        ...STABLE_CHARTS.NGINX_INGRESS,
        order: 3,
      },
    },
    besu: {
      1.4: {
        ...STABLE_CHARTS.BESU,
        order: 2,
      },
    },
  },
}
