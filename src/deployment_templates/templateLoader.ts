/* eslint-disable no-restricted-syntax */
import merge from 'deepmerge'
import { resolve } from 'path'
import { edition } from '../edition'
import { getYaml } from '../utils/yaml'

const { chartTable } = edition

const overwriteDestination = (_destination: never, source: any) => source

const HELM_CHARTS_PATH = resolve(__dirname, './../../helmCharts')

const getClassicDeploymentDetails = (deploymentTemplates: any[]) =>
  deploymentTemplates.reduce((allTemplates, type) => {
    // eslint-disable-next-line global-require, no-param-reassign, import/no-dynamic-require
    allTemplates[type] = require(`./${type}`)
    return allTemplates
  }, {})

// pulls values from details.yaml to build an object with the same structure as the index files
const structureYamlContent = (yamlContent: any) => {
  const sextant = yamlContent
  const deploymentType = sextant.deploymentType || ''
  const deploymentVersion = sextant.deploymentVersion || ''
  const chartInfo = chartTable[deploymentType][deploymentVersion]
  const details: { forms: any; summary: any; paths: any; button: { versions: any[] }; order?: number }[] = []

  // define a basic schema
  details[deploymentType] = {
    forms: {},
    summary: {},
    paths: {},
    button: {
      versions: [],
    },
  }

  const entry = details[deploymentType]

  // eslint-disable-next-line global-require, import/no-dynamic-require
  entry.forms[deploymentVersion] = require(resolve(HELM_CHARTS_PATH, deploymentType, deploymentVersion, sextant.form))
  // eslint-disable-next-line global-require, import/no-dynamic-require
  entry.summary[deploymentVersion] = require(resolve(
    HELM_CHARTS_PATH,
    deploymentType,
    deploymentVersion,
    sextant.summary
  ))
  entry.paths[deploymentVersion] = { name: sextant.namePath, namespace: sextant.namespacePath }
  entry.button.versions.push({
    title: sextant.title || '',
    icon: sextant.buttonIcon || '',
    version: sextant.sextantVersion || '',
    form: `${sextant.deploymentVersion}` || '',
    description: sextant.description || '',
    features: sextant.features || [],
  })
  entry.order = chartInfo.order

  return details
}

// iterates over all of the charts in the helmCharts directory,
// re-structures and merges the deployment details together
export const getHelmDeploymentDetails = () => {
  let details = {}
  const deploymentTypes = Object.keys(chartTable)

  for (const deploymentType of deploymentTypes) {
    const deploymentTypeData = chartTable[deploymentType]
    const deploymentVersions = Object.keys(deploymentTypeData)
    for (const deploymentVersion of deploymentVersions) {
      try {
        const { chart } = chartTable[deploymentType][deploymentVersion]
        const chartName = chart.split('/')[1]
        const yamlContent = getYaml(
          `${HELM_CHARTS_PATH}/${deploymentType}/${deploymentVersion}/${chartName}/sextant/details.yaml`
        )
        const next = structureYamlContent(yamlContent)

        details = merge(details, next, { arrayMerge: overwriteDestination })
      } catch (e) {
        // if chart versions have a mismatch then allow the server to boot in dev mode
        // eslint-disable-next-line eqeqeq
        if (!process.env.IGNORE_BROKEN_CHARTS || process.env.NODE_ENV != 'development') {
          throw e
        }
      }
    }
  }

  return details
}

// merges the classic deployment details with the helm chart details
export const mergedDeploymentDetails = () => {
  const classicDeployments = getClassicDeploymentDetails(edition.deployment.classic)
  const helmDeployments = getHelmDeploymentDetails()
  const merged = merge(classicDeployments, helmDeployments, { arrayMerge: overwriteDestination })
  return merged
}
