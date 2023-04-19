import * as path from 'path'
import { edition } from '../../../edition'
import { Chart, ChartBundleName, ChartVersion } from '../../../edition-type'
import { getYaml } from '../../../utils/yaml'

export function helmChartPath() {
  if (__dirname.includes('dist')) {
    return path.resolve(__dirname, '../../../../../helmCharts')
  } else {
    return path.resolve(__dirname, '../../../../helmCharts')
  }
}

export const getChartInfo = (deployment_type: ChartBundleName, deployment_version: ChartVersion): Chart => {
  const { chartTable } = edition

  const chartInfo = chartTable[deployment_type][deployment_version]

  return chartInfo
}

export const getChartName = (chartInfo: Chart): string => {
  const { chart } = chartInfo
  const name = chart.split('/')[1]
  return name
}

export const getChartVersion = (deploymentType: ChartBundleName, deploymentVersion: ChartVersion): string => {
  const chartInfo = getChartInfo(deploymentType, deploymentVersion)
  const chartName = getChartName(chartInfo)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const chart = getYaml(`${helmChartPath()}/${deploymentType}/${deploymentVersion}/${chartName}/Chart.yaml`)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { version } = chart
  return version as string
}
