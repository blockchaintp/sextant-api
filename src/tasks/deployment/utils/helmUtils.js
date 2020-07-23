const {edition} = require('../../../edition')

const getChartInfo = (deployment_type, deployment_version) => {
  const chartTable = edition.chartTable
  
  const chartInfo = chartTable[deployment_type][deployment_version]
  
  return chartInfo
}

module.exports = { getChartInfo }
