const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

const readFile = fs.readFileSync

const { edition } = require('../../../edition/index')

const HELM_CHARTS_PATH = path.resolve(__dirname, '../../../../helmCharts')

const getChartInfo = (deployment_type, deployment_version) => {
  const { chartTable } = edition

  const chartInfo = chartTable[deployment_type][deployment_version]

  return chartInfo
}

const getYaml = (filepath) => {
  const yamlContent = readFile(filepath, 'utf8')
  return yaml.safeLoad(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}

const getChartName = (chartInfo) => {
  const { chart } = chartInfo
  const name = chart.split('/')[1]
  return name
}

const getChartVersion = (deploymentType, deploymentVersion) => {
  const chartInfo = getChartInfo(deploymentType, deploymentVersion)
  const chartName = getChartName(chartInfo)
  const Chart = getYaml(`${HELM_CHARTS_PATH}/${deploymentType}/${deploymentVersion}/${chartName}/Chart.yaml`)
  const { version } = Chart
  return version
}

module.exports = { getChartInfo, getChartVersion, getChartName }
