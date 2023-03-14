type MeteringType = 'dev' | 'aws'

type HelmRepository = {
  name: string
  url: string
}

export type ChartBundleName = string

export type ChartVersion = string

type ChartTable = {
  [key: ChartBundleName]: ChartBundle
}

export type Chart = {
  chart: string
  chartVersion: string
  extension: string
  order: number
}

type ChartBundle = {
  [key: ChartVersion]: Chart
}
/**
 * The Edition type is used to define the structure of the edition file.
 *
 **/
export type Edition = {
  chartTable: ChartTable
  deployment: {
    classic: []
  }
  helmRepos: HelmRepository[]
  metering: {
    productCode?: string
    publicKeyVersion?: number
    type: MeteringType
  }
}
