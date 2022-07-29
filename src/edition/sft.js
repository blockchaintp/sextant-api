// Edition object for SFT editions (sawtooth+TFS)
const repositories = require('./charts/repositories')
const UNSTABLE_CHARTS = require('./charts/btp-unstable')
const METERING = require('./metering/metering')
const DEPLOYMENT_SPEC = require('./deployment')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [repositories.BTP_UNSTABLE],
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

module.exports = {
  edition,
}
