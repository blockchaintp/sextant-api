const repoName = require('./repositories').BTP_UNSTABLE.name
const STABLE_CHARTS = require('./btp-stable')

function modChart(originalChart, options) {
  const { chart, chartVersion, extension } = options
  return {
    chart: chart || originalChart.chart,
    chartVersion: chartVersion || originalChart.chartVersion,
    extension: extension || originalChart.extension,
  }
}

function asUnstable(stableChart) {
  const elems = stableChart.chart.split('/')
  if (elems.length > 1) {
    elems.shift()
  }
  const chartName = `${repoName}/${elems.join('/')}`

  return modChart(stableChart, { chart: chartName })
}

const UNSTABLE_CHARTS = {
  DAML_ON_BESU: asUnstable(STABLE_CHARTS.DAML_ON_BESU),
  DAML_ON_SAWTOOTH: asUnstable(STABLE_CHARTS.DAML_ON_SAWTOOTH),
  DAML_ON_QLDB: asUnstable(STABLE_CHARTS.DAML_ON_QLDB),
  DAML_ON_POSTGRES: asUnstable(STABLE_CHARTS.DAML_ON_POSTGRES),
  BESU: asUnstable(STABLE_CHARTS.BESU),
  SAWTOOTH: asUnstable(STABLE_CHARTS.SAWTOOTH),
  TFS_ON_SAWTOOTH: asUnstable(STABLE_CHARTS.TFS_ON_SAWTOOTH),
  ELASTICSEARCH: asUnstable(STABLE_CHARTS.ELASTICSEARCH),
  FLUENTD: asUnstable(STABLE_CHARTS.FLUENTD),
  KIBANA: asUnstable(STABLE_CHARTS.KIBANA),
  INFLUXDB: asUnstable(STABLE_CHARTS.INFLUXDB),
  GRAFANA: asUnstable(STABLE_CHARTS.GRAFANA),
  POSTGRESQL_HA: asUnstable(STABLE_CHARTS.POSTGRESQL_HA),
  NGINX_INGRESS: asUnstable(STABLE_CHARTS.NGINX_INGRESS),
  OPENEBS: asUnstable(STABLE_CHARTS.OPENEBS),
  VAULT: asUnstable(STABLE_CHARTS.VAULT),
  SEXTANT: asUnstable(STABLE_CHARTS.SEXTANT),
}

module.exports = UNSTABLE_CHARTS
