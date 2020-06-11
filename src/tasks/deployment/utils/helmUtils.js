
/*
This function relies on the chartTable in the edition object 
Using the deployment type and version, determine whether or not the template type is helm or classic
The template type will always default to 'classic'
*/

const { edition } = require('../../../edition')

const getTemplateType = (deployment_type, deployment_version) => {

  const chartTable = edition.chartTable
  let templateType

  if (chartTable && chartTable[deployment_type] && chartTable[deployment_version]) {
    templateType = 'helm'
  } else {
    templateType = 'classic'
  }

  return templateType
}

const getChartInfo = (deployment_type, deployment_version) => {
  const chartTable = edition.chartTable
  
  const chartInfo = chartTable[deployment_type][deployment_version]
  
  return chartInfo
}

module.exports = { getTemplateType, getChartInfo }