import merge from 'deepmerge'
import * as path from 'path'
import { edition } from '../edition'
import { ChartBundleName, ChartVersion } from '../edition-type'
import { helmChartPath } from '../tasks/deployment/utils/helmUtils'
import { ContentCache } from '../utils/content-cache'
import { getYaml } from '../utils/yaml'

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

export type ChartBundleDetailsMap = {
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

const { chartTable } = edition

export const overwriteMerge = (destinationArray: any[], sourceArray: any[]): any[] => sourceArray

const DeploymentTemplateCache = new ContentCache()

function replaceAll(searchString: string, replaceString: string, originalString: string) {
  let previousString = originalString
  let newString = originalString.replace(searchString, replaceString)
  while (newString !== previousString) {
    previousString = newString
    newString = previousString.replace(searchString, replaceString)
  }
  return newString
}

// pulls values from details.yaml to build an object with the same structure as the index files
const structureYamlContent = (yamlContent: ChartDetails) => {
  const deploymentType: ChartBundleName = String(yamlContent.deploymentType)
  const deploymentVersion: ChartVersion = String(yamlContent.deploymentVersion)
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

  const formPath = path.resolve(helmChartPath(), deploymentType, deploymentVersion, yamlContent.form)
  const formDir = path.dirname(formPath)
  let formDefinition = DeploymentTemplateCache.getFileSync(formPath)
  formDefinition = replaceAll(`require('./`, `require('${formDir}/`, formDefinition)
  formDefinition = `"use strict"\n${formDefinition}`

  const summaryPath = path.resolve(helmChartPath(), deploymentType, deploymentVersion, yamlContent.summary)
  const summaryDir = path.dirname(summaryPath)
  let summaryDefinition = DeploymentTemplateCache.getFileSync(summaryPath)
  summaryDefinition = replaceAll(`require('./`, `require('${summaryDir}/`, summaryDefinition)
  summaryDefinition = `"use strict"\n${summaryDefinition}`

  try {
    const formDefStr = `${formDefinition}`
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    entry.forms[deploymentVersion] = eval(formDefStr)
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new Error(`Error reading form definition for ${deploymentType} ${deploymentVersion} ${e.message}`)
    } else {
      throw new Error(`Error reading form definition for ${deploymentType} ${deploymentVersion}`)
    }
  }

  try {
    const summaryDefStr = `${summaryDefinition}`
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    entry.summary[deploymentVersion] = eval(summaryDefStr)
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new Error(`Error reading summary definition for ${deploymentType} ${deploymentVersion} ${e.message}`)
    } else {
      throw new Error(`Error reading summary definition for ${deploymentType} ${deploymentVersion}`)
    }
  }

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
export function getHelmDeploymentDetails() {
  let allDetails: ChartBundleDetailsMap = {}
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
          `${helmChartPath()}/${chartBundleName}/${chartVersion}/${chartName}/sextant/details.yaml`
        ) as ChartDetails
        const theseDetails = structureYamlContent(yamlContent)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
