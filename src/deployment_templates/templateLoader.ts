import * as merge from 'deepmerge'
import * as path from 'path'
import { edition } from '../edition'
import { ChartBundleName, ChartVersion } from '../edition-type'
import { HELM_CHARTS_PATH } from '../tasks/deployment/utils/helmUtils'
import { getYaml } from '../utils/yaml'

const { chartTable } = edition

const overwriteMerge = (destinationArray: any[], sourceArray: any[]): any[] => sourceArray

type ChartParsedDetails = {
  button: {
    versions: ButtonVersion[]
  }
  forms: {
    [key: ChartVersion]: any
  }
  order: number
  paths: {
    [key: ChartVersion]: {
      name: string
      namespace: string
    }
  }
  summary: {
    [key: string]: any
  }
}

type ChartBundleDetailsMap = {
  [key: ChartBundleName]: ChartParsedDetails
}

type ChartDetails = {
  buttonIcon: IconLocation
  deploymentType: ChartBundleName
  deploymentVersion: ChartVersion
  description: string
  features: string[]
  form: string
  name: string
  namePath: string
  namespacePath: string
  sextantVersion: SextantVersion
  summary: string
  title: string
}

type SextantVersion = string
type IconLocation = string

type ButtonVersion = Pick<ChartDetails, 'description' | 'features' | 'title'> & {
  // NOTE: This is weird, it's as it always was but I see no obvious reason why
  // deploymentVersion should populate a field named `form`
  form: ChartVersion
  icon: IconLocation
  version: SextantVersion
}

// pulls values from details.yaml to build an object with the same structure as the index files
const structureYamlContent = (yamlContent: ChartDetails) => {
  const deploymentType: ChartBundleName = yamlContent.deploymentType
  const deploymentVersion: ChartVersion = yamlContent.deploymentVersion
  const chartInfo = chartTable[deploymentType][deploymentVersion]
  const details: ChartBundleDetailsMap = {}

  // define a basic schema
  details[deploymentType] = {
    forms: {},
    summary: {},
    paths: {},
    button: {
      versions: [],
    },
    order: 0,
  }

  const entry = details[deploymentType]

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  entry.forms[deploymentVersion] = require(path.resolve(
    HELM_CHARTS_PATH,
    deploymentType,
    deploymentVersion,
    yamlContent.form
  ))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  entry.summary[deploymentVersion] = require(path.resolve(
    HELM_CHARTS_PATH,
    deploymentType,
    deploymentVersion,
    yamlContent.summary
  ))

  entry.paths[deploymentVersion] = { name: yamlContent.namePath, namespace: yamlContent.namespacePath }
  entry.button.versions.push({
    title: yamlContent.title,
    icon: yamlContent.buttonIcon,
    version: yamlContent.sextantVersion,
    form: `${yamlContent.deploymentVersion}`,
    description: yamlContent.description,
    features: yamlContent.features,
  })
  entry.order = chartInfo.order

  return details
}

// iterates over all of the charts in the helmCharts directory,
// re-structures and merges the deployment details together
const getHelmDeploymentDetails = () => {
  let allDetails = {}
  const deploymentTypes = Object.keys(chartTable)

  for (const chartBundleName of deploymentTypes) {
    const chartBundle = chartTable[chartBundleName]
    const chartVersionNames = Object.keys(chartBundle)
    for (const chartVersion of chartVersionNames) {
      try {
        const { chart } = chartTable[chartBundleName][chartVersion]
        const chartName = chart.split('/')[1]
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const yamlContent = getYaml(
          `${HELM_CHARTS_PATH}/${chartBundleName}/${chartVersion}/${chartName}/sextant/details.yaml`
        ) as ChartDetails
        const theseDetails = structureYamlContent(yamlContent)

        allDetails = merge(allDetails, theseDetails, { arrayMerge: overwriteMerge })
      } catch (e) {
        // if chart versions have a mismatch then allow the server to boot in dev mode
        if (!process.env.IGNORE_BROKEN_CHARTS || process.env.NODE_ENV != 'development') {
          throw e
        }
      }
    }
  }

  return allDetails
}

// merges the classic deployment details with the helm chart details
export const mergedDeploymentDetails = () => {
  return getHelmDeploymentDetails()
}
