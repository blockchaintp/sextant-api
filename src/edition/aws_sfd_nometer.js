/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for DAML on Sawtooth
const repositories = require('./charts/repositories')
const STABLE_CHARTS = require('./charts/btp-stable')
const METERING = require('./metering/metering')
const DEPLOYMENT_SPEC = require('./deployment')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [repositories.BTP_STABLE],
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
