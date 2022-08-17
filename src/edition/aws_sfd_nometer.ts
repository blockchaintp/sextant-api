/* eslint-disable import/prefer-default-export */
/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth
import { BTP_STABLE, STABLE_CHARTS } from './charts/repositories'
import DEPLOYMENT_SPEC from './deployment'
import METERING from './metering/metering'
import { SextantEdition } from './types'

export const edition: SextantEdition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [BTP_STABLE],
  chartTable: {
    'daml-on-besu': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_BESU,
        order: 1,
      },
    },
    'daml-on-postgres': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_POSTGRES,
        order: 4,
      },
    },
    'daml-on-sawtooth': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_SAWTOOTH,
        order: 2,
      },
    },
    'daml-on-qldb': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_QLDB,
        order: 3,
      },
    },
    openebs: {
      '2.0': {
        ...STABLE_CHARTS.OPENEBS,
        order: 7,
      },
    },
    'nginx-ingress': {
      1.8: {
        ...STABLE_CHARTS.NGINX_INGRESS,
        order: 6,
      },
    },
    'postgresql-ha': {
      11.9: {
        ...STABLE_CHARTS.POSTGRESQL_HA,
        order: 5,
      },
    },
  },
}

module.exports = {
  edition,
}
