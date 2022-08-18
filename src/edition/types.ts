import { HelmChart, HelmRepository } from './charts/types'
import { MeteringSpec } from './metering/types'

type DeploymentSpec = {
  classic: []
}

export type ChartTableEntry = HelmChart & {
  order: number
}

export type ChartVersionGroup = {
  [key: string]: ChartTableEntry
}

export type ChartTable = {
  [key: string]: ChartVersionGroup
}

export type SextantEdition = {
  deployment: DeploymentSpec
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metering: MeteringSpec<any>
  helmRepos: HelmRepository[]
  chartTable: ChartTable
}
