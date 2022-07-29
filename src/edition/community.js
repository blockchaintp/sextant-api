// Edition object for community edition (sawtooth+DAML)
const repositories = require('./charts/repositories')
const STABLE_CHARTS = require('./charts/btp-stable')
const METERING = require('./metering/metering')
const DEPLOYMENT_SPEC = require('./deployment')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [repositories.BTP_STABLE],
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

module.exports = {
  edition,
}
