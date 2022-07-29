// Edition object for enterprise editions (sawtooth+DAML)
const repositories = require('./charts/repositories')
const STABLE_CHARTS = require('./charts/btp-stable')
const METERING = require('./metering/metering')
const DEPLOYMENT_SPEC = require('./deployment')

const communityEdition = require('./community')

const edition = {
  deployment: DEPLOYMENT_SPEC.EMPTY,
  metering: METERING.DEV,
  helmRepos: [repositories.BTP_STABLE],
  chartTable: {
    ...communityEdition.chartTable,
    'daml-on-qldb': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_QLDB,
        order: 5,
      },
    },
    'daml-on-postgres': {
      1.3: {
        ...STABLE_CHARTS.DAML_ON_POSTGRES,
        order: 6,
      },
    },
    'tfs-on-sawtooth': {
      0.1: {
        ...STABLE_CHARTS.TFS_ON_SAWTOOTH,
        order: 7,
      },
    },
    elasticsearch: {
      7.9: {
        ...STABLE_CHARTS.ELASTICSEARCH,
        order: 9,
      },
    },
    fluentd: {
      1.11: {
        ...STABLE_CHARTS.FLUENTD,
        order: 10,
      },
    },
    kibana: {
      7.8: {
        ...STABLE_CHARTS.KIBANA,
        order: 11,
      },
    },
    influxdb: {
      1.8: {
        ...STABLE_CHARTS.INFLUXDB,
        order: 12,
      },
    },
    grafana: {
      7.1: {
        ...STABLE_CHARTS.GRAFANA,
        order: 13,
      },
    },
    'postgresql-ha': {
      11.9: {
        ...STABLE_CHARTS.POSTGRESQL_HA,
        order: 14,
      },
    },
    'nginx-ingress': {
      1.8: {
        ...STABLE_CHARTS.NGINX_INGRESS,
        order: 15,
      },
    },
    openebs: {
      '2.0': {
        ...STABLE_CHARTS.OPENEBS,
        order: 16,
      },
    },
    vault: {
      1.5: {
        ...STABLE_CHARTS.VAULT,
        order: 17,
      },
    },
  },
}

module.exports = {
  edition,
}
