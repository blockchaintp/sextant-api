const repoName = require('./repositories').BTP_UNSTABLE.name

const STABLE_CHARTS = {
  DAML_ON_BESU: {
    chart: `${repoName}/daml-on-besu`,
    chartVersion: '~0.0.32',
    extension: 'daml',
  },
  DAML_ON_SAWTOOTH: {
    chart: `${repoName}/daml-on-sawtooth`,
    chartVersion: '~0.2.0',
    extension: 'daml',
  },
  DAML_ON_QLDB: {
    chart: `${repoName}/daml-on-qldb`,
    chartVersion: '~0.0.9',
    extension: 'daml',
  },
  DAML_ON_POSTGRES: {
    chart: `${repoName}/daml-on-postgres`,
    chartVersion: '~0.1.1',
    extension: 'daml',
  },
  BESU: {
    chart: `${repoName}/besu`,
    chartVersion: '~0.0.8',
    extension: 'besu',
  },
  SAWTOOTH: {
    chart: `${repoName}/sawtooth`,
    chartVersion: '~0.2.0',
    extension: 'sawtooth',
  },
  TFS_ON_SAWTOOTH: {
    chart: `${repoName}/tfs-on-sawtooth`,
    chartVersion: '~0.6.0',
    extension: 'tfs',
  },
  ELASTICSEARCH: {
    chart: `${repoName}/elasticsearch`,
    chartVersion: '~12.6.3',
    extension: 'elasticsearch',
  },
  FLUENTD: {
    chart: `${repoName}/fluentd`,
    chartVersion: '~1.3.1',
    extension: 'fluentd',
  },
  KIBANA: {
    chart: `${repoName}/kibana`,
    chartVersion: '~5.3.9',
    extension: 'kibana',
  },
  INFLUXDB: {
    chart: `${repoName}/influxdb`,
    chartVersion: '~0.0.2',
    extension: 'influxdb',
  },
  GRAFANA: {
    chart: `${repoName}/grafana`,
    chartVersion: '~0.0.2',
    extension: 'grafana',
  },
  POSTGRESQL_HA: {
    chart: `${repoName}/postgresql-ha`,
    chartVersion: '~0.0.1',
    extension: 'pgsql',
  },
  NGINX_INGRESS: {
    chart: `${repoName}/nginx-ingress`,
    chartVersion: '~0.0.1',
    extension: 'ingress',
  },
  OPENEBS: {
    chart: `${repoName}/openebs`,
    chartVersion: '~2.0.2',
    extension: 'openebs',
  },
  VAULT: {
    chart: `${repoName}/vault`,
    chartVersion: '~0.0.2',
    extension: 'vault',
  },
  SEXTANT: {
    chart: `${repoName}/sextant`,
    chartVersion: '~2.1.8',
    extension: 'sextant',
  },
}

module.exports = STABLE_CHARTS
