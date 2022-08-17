import { HelmChart, HelmRepository } from './charts/types'
import { MeteringSpec } from './metering/types'

type DeploymentSpec = {
  classic: []
}

type ChartTableEntry = HelmChart & {
  order: number
}

type ChartVersionGroup = {
  [key: string]: ChartTableEntry
}

type ChartTable = {
  [key: string]: ChartVersionGroup
}

export type SextantEdition = {
  deployment: DeploymentSpec
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metering: MeteringSpec<any>
  helmRepos: HelmRepository[]
  chartTable: ChartTable
}
