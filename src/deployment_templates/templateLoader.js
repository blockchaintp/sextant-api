
const fs = require('fs');
const path = require('path')
const yaml = require('js-yaml')
const merge = require('deepmerge')
const Promise = require('bluebird')
// const readdir = Promise.promisify(fs.readdir)
// const readFile = Promise.promisify(fs.readFile)
const readdir = fs.readdirSync
const readFile = fs.readFileSync

const { edition } = require('../../src/edition')

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

const HELM_CHARTS_PATH = path.resolve(__dirname, './../../helmCharts')


const getClassicDeploymentDetails = (deploymentTemplates) => {
  return deploymentTemplates
    .reduce((allTemplates, type) => {
      allTemplates[type] = require(`./${type}`)
      return allTemplates
    }, {}
    )
}

// reads and loads yaml from a file
const getYaml = (filepath) => {
  const yamlContent = readFile(filepath, 'utf8')
  return yaml.safeLoad(yamlContent)
}

// pulls values from details.yaml to build an object with the same structure as the index files
const structureYamlContent = (yamlContent) => {
  const sextant = yamlContent.sextant
  const deploymentType = sextant.deploymentType || ''
  const deploymentVersion = sextant.deploymentVersion.toString() || ''
  let details = {}

  // define a basic schema
  details[deploymentType] = {
    forms: {},
    summary: {},
    paths: {},
    button: {
      versions: [],
    },
  }

  let entry = details[deploymentType]

  entry.forms[deploymentVersion] = require(path.resolve(HELM_CHARTS_PATH, sextant.form))
  entry.summary[deploymentVersion] = require(path.resolve(HELM_CHARTS_PATH, sextant.summary))
  entry.paths[deploymentVersion] = { name: sextant.namePath, namespace: sextant.namespacePath }
  entry.button.versions.push({
    title: sextant.title || '',
    icon: sextant.buttonIcon || '',
    version: sextant.version || '',
    form: `${sextant.deploymentVersion}` || '',
    description: yamlContent.description || '',
    features: sextant.features || []
  })

  return details

}

// iterates over all of the charts in the helmCharts directory, re-structures and merges the deployment details together
const getHelmDeploymentDetails = () => {
  let details = {}
  const charts = readdir(HELM_CHARTS_PATH)

  for (chart of charts) {
    const yamlContent = getYaml(`${HELM_CHARTS_PATH}/${chart}/sextant/details.yaml`)
    const next = structureYamlContent(yamlContent)

    details = merge(details, next, { arrayMerge: overwriteMerge })
  }

  return details
}

// merges the classic deployment details with the helm chart details
const mergedDeploymentDetails = () => {
  const classicDeployments = getClassicDeploymentDetails(edition.deployment.classic)
  
  const helmDeployments = getHelmDeploymentDetails()

  const merged = merge(classicDeployments, helmDeployments, { arrayMerge: overwriteMerge })

  return merged
}

module.exports = {
  mergedDeploymentDetails
}
