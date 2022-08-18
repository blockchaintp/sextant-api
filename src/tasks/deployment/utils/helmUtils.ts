import { resolve } from 'path'
import { edition } from '../../../edition/index'
import { ChartTableEntry } from '../../../edition/types'
import { getYaml } from '../../../utils/yaml'

const HELM_CHARTS_PATH = resolve(__dirname, '../../../../helmCharts')

export const getChartInfo = (deploymentType: string, deploymentVersion: string): ChartTableEntry => {
  const { chartTable } = edition

  const chartInfo = chartTable[deploymentType][deploymentVersion]

  return chartInfo
}

export const getChartName = (chartInfo: ChartTableEntry): string => {
  const { chart } = chartInfo
  const name = chart.split('/')[1]
  return name
}

export const getChartVersion = (deploymentType: string, deploymentVersion: string): string => {
  const chartInfo = getChartInfo(deploymentType, deploymentVersion)
  const chartName = getChartName(chartInfo)
  const chartYaml: any = getYaml(`${HELM_CHARTS_PATH}/${deploymentType}/${deploymentVersion}/${chartName}/Chart.yaml`)
  const { version } = chartYaml
  return version
}
