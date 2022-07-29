/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

// Edition object for Sawtooth
const repositories = require('./charts/repositories')
const STABLE_CHARTS = require('./charts/btp-stable')
const METERING = require('./metering/metering')
const DEPLOYMENT_SPEC = require('./deployment')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [repositories.BTP_STABLE],
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

module.exports = {
  edition,
}
