// Edition object for enterprise editions (sawtooth+DAML)
import { HelmRepository, HelmChart, HelmChartBundle } from './types'

export const BTP_STABLE: HelmRepository = {
  name: 'btp-stable',
  url: 'https://btp-charts-stable.s3.amazonaws.com/charts',
}

export const BTP_UNSTABLE: HelmRepository = {
  name: 'btp-unstable',
  url: 'https://btp-charts-unstable.s3.amazonaws.com/charts',
}

function modChart(originalChart: HelmChart, options: Partial<HelmChart>) {
  const { chart, chartVersion, extension } = options
  return {
    chart: chart || originalChart.chart,
    chartVersion: chartVersion || originalChart.chartVersion,
    extension: extension || originalChart.extension,
  }
}

function alternateRepository(chart: HelmChart, repository: HelmRepository) {
  const elems = chart.chart.split('/')
  if (elems.length > 1) {
    elems.shift()
  }
  const chartName = `${repository.name}/${elems.join('/')}`
  return modChart(chart, { chart: chartName })
}

function fromUnstable(chart: HelmChart) {
  return alternateRepository(chart, BTP_UNSTABLE)
}

export const STABLE_CHARTS: HelmChartBundle = {
  DAML_ON_BESU: {
    chart: `${BTP_STABLE.name}/daml-on-besu`,
    chartVersion: '~0.0.32',
    extension: 'daml',
  },
  DAML_ON_SAWTOOTH: {
    chart: `${BTP_STABLE.name}/daml-on-sawtooth`,
    chartVersion: '~0.2.0',
    extension: 'daml',
  },
  DAML_ON_QLDB: {
    chart: `${BTP_STABLE.name}/daml-on-qldb`,
    chartVersion: '~0.0.9',
    extension: 'daml',
  },
  DAML_ON_POSTGRES: {
    chart: `${BTP_STABLE.name}/daml-on-postgres`,
    chartVersion: '~0.1.1',
    extension: 'daml',
  },
  BESU: {
    chart: `${BTP_STABLE.name}/besu`,
    chartVersion: '~0.0.8',
    extension: 'besu',
  },
  SAWTOOTH: {
    chart: `${BTP_STABLE.name}/sawtooth`,
    chartVersion: '~0.2.0',
    extension: 'sawtooth',
  },
  TFS_ON_SAWTOOTH: {
    chart: `${BTP_STABLE.name}/tfs-on-sawtooth`,
    chartVersion: '~0.6.0',
    extension: 'tfs',
  },
  ELASTICSEARCH: {
    chart: `${BTP_STABLE.name}/elasticsearch`,
    chartVersion: '~12.6.3',
    extension: 'elasticsearch',
  },
  FLUENTD: {
    chart: `${BTP_STABLE.name}/fluentd`,
    chartVersion: '~1.3.1',
    extension: 'fluentd',
  },
  KIBANA: {
    chart: `${BTP_STABLE.name}/kibana`,
    chartVersion: '~5.3.9',
    extension: 'kibana',
  },
  INFLUXDB: {
    chart: `${BTP_STABLE.name}/influxdb`,
    chartVersion: '~0.0.2',
    extension: 'influxdb',
  },
  GRAFANA: {
    chart: `${BTP_STABLE.name}/grafana`,
    chartVersion: '~0.0.2',
    extension: 'grafana',
  },
  POSTGRESQL_HA: {
    chart: `${BTP_STABLE.name}/postgresql-ha`,
    chartVersion: '~0.0.1',
    extension: 'pgsql',
  },
  NGINX_INGRESS: {
    chart: `${BTP_STABLE.name}/nginx-ingress`,
    chartVersion: '~0.0.1',
    extension: 'ingress',
  },
  OPENEBS: {
    chart: `${BTP_STABLE.name}/openebs`,
    chartVersion: '~2.0.2',
    extension: 'openebs',
  },
  VAULT: {
    chart: `${BTP_STABLE.name}/vault`,
    chartVersion: '~0.0.2',
    extension: 'vault',
  },
  SEXTANT: {
    chart: `${BTP_STABLE.name}/sextant`,
    chartVersion: '~2.1.8',
    extension: 'sextant',
  },
}

export const UNSTABLE_CHARTS = {
  DAML_ON_BESU: fromUnstable(STABLE_CHARTS.DAML_ON_BESU),
  DAML_ON_SAWTOOTH: fromUnstable(STABLE_CHARTS.DAML_ON_SAWTOOTH),
  DAML_ON_QLDB: fromUnstable(STABLE_CHARTS.DAML_ON_QLDB),
  DAML_ON_POSTGRES: fromUnstable(STABLE_CHARTS.DAML_ON_POSTGRES),
  BESU: fromUnstable(STABLE_CHARTS.BESU),
  SAWTOOTH: fromUnstable(STABLE_CHARTS.SAWTOOTH),
  TFS_ON_SAWTOOTH: fromUnstable(STABLE_CHARTS.TFS_ON_SAWTOOTH),
  ELASTICSEARCH: fromUnstable(STABLE_CHARTS.ELASTICSEARCH),
  FLUENTD: fromUnstable(STABLE_CHARTS.FLUENTD),
  KIBANA: fromUnstable(STABLE_CHARTS.KIBANA),
  INFLUXDB: fromUnstable(STABLE_CHARTS.INFLUXDB),
  GRAFANA: fromUnstable(STABLE_CHARTS.GRAFANA),
  POSTGRESQL_HA: fromUnstable(STABLE_CHARTS.POSTGRESQL_HA),
  NGINX_INGRESS: fromUnstable(STABLE_CHARTS.NGINX_INGRESS),
  OPENEBS: fromUnstable(STABLE_CHARTS.OPENEBS),
  VAULT: fromUnstable(STABLE_CHARTS.VAULT),
  SEXTANT: fromUnstable(STABLE_CHARTS.SEXTANT),
}
