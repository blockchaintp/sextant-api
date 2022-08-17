export type HelmRepository = {
  name: string
  url: string
}

export type HelmChart = {
  chart: string
  chartVersion: string
  extension: string
}

export type HelmChartBundle = {
  [key: string]: HelmChart
}
