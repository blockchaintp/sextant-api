const fs = require('promise-fs')
const path = require('path')
const Promise = require('bluebird')
const merge = require('deepmerge')
const yaml = require('js-yaml')
const { tempName, tmpDir } = require('tmp-promise')
const { exec } = require('child-process-promise')
const { getYaml, writeYaml } = require('../utils/yaml')

const { readdir, writeFile } = fs

const logger = require('../logging').getLogger({
  name: 'deployment_templates/render',
})

const DEFAULTS_FILE = 'defaults.yaml'

// eslint-disable-next-line no-unused-vars
const overwriteMerge = (destinationArray, sourceArray) => sourceArray

/*

  for a template type and version - return the folder
  in which the templates live

*/
const getTemplateFolder = ({ deployment_type: deploymentType, deployment_version: deploymentVersion }) =>
  path.resolve(__dirname, deploymentType, deploymentVersion)

/*

  get the path to the defaults file for a template

*/
const getDefaultsFile = ({ deployment_type: deploymentType, deployment_version: deploymentVersion }) =>
  path.resolve(
    getTemplateFolder({
      deployment_type: deploymentType,
      deployment_version: deploymentVersion,
    }),
    DEFAULTS_FILE
  )

/*

  get the processed yaml for the defaults of a template of a
  given type and version

*/
const getTemplateDefaults = ({ deployment_type: deploymentType, deployment_version: deploymentVersion }) => {
  const filepath = getDefaultsFile({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
  })
  return getYaml(filepath)
}

/*

  merge the desired state of the deployment with the default template
  data to get deployable values

*/
const getTemplateData = async ({
  deployment_type: deploymentType,
  deployment_version: deploymentVersion,
  desired_state: desiredState,
}) => {
  const defaults = await getTemplateDefaults({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
  })
  const initialData = merge(defaults, desiredState, { arrayMerge: overwriteMerge })

  if (initialData.sawtooth && initialData.sawtooth.customTPs) {
    const initialCustomTPs = initialData.sawtooth.customTPs

    const formattedCustomTPs = initialCustomTPs.map((tp) => ({
      // id: tp.id and index: tp.index values removed,
      name: tp.name,
      image: tp.image,
      command: tp.command ? tp.command.split(' ') : null,
      args: tp.args ? tp.args.split(' ') : null,
    }))

    initialData.sawtooth.customTPs = formattedCustomTPs
  }
  return initialData
}

/*

  merge the desired state of the deployment
  with the template defaults and write a yaml file
  to a temporary location

  return the filepath to the values.yaml

*/
// TODO  - error handling for custom yaml
const writeTemplateValues = async ({
  deployment_type: deploymentType,
  deployment_version: deploymentVersion,
  desired_state: desiredState,
  custom_yaml: customYaml,
}) => {
  const valuesPath = await tempName({
    postfix: '.yaml',
  })

  const templateData = await getTemplateData({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
    desired_state: desiredState,
  })
  let mergedYamlData

  // parse string into yaml object
  const parsedYaml = yaml.safeLoad(customYaml)

  if (parsedYaml) {
    // merge yaml from the form input with custom yaml input
    mergedYamlData = merge(templateData, parsedYaml, { arrayMerge: overwriteMerge })
  } else {
    mergedYamlData = templateData
  }

  writeYaml(valuesPath, mergedYamlData)

  return valuesPath
}

/*

  get a list of the templates for a deployment / version
  this will resolve any .yaml file in the template folder
  exclude `defaults.yaml`

*/
const getTemplates = async ({ deployment_type: deploymentType, deployment_version: deploymentVersion }) => {
  const templateFolder = getTemplateFolder({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
  })
  const files = await readdir(templateFolder)

  return files
    .filter((filename) => {
      if (!filename.match(/\.yaml$/)) return false
      // eslint-disable-next-line eqeqeq
      if (filename == DEFAULTS_FILE) return false
      return true
    })
    .sort()
}

/*

  get the result of a template render

*/

const cleanUp = (filePath) => {
  fs.unlink(filePath, (err) => {
    logger.info({
      action: 'unlinkFile',
      filepath: filePath,
      error: err,
    })
  })
}

const renderTemplate = async ({ templateName, valuesPath, inputDirectory, outputDirectory }) => {
  const inputTemplatePath = path.resolve(inputDirectory, templateName)
  const outputTemplatePath = path.resolve(outputDirectory, templateName)
  const runCommand = `kubetpl render -i ${valuesPath} ${inputTemplatePath}`
  logger.debug({ action: 'renderTemplate', command: runCommand })
  const stdout = await exec(runCommand).catch((err) => {
    // make the kubetpl error message nicely readable
    const message = err
      .toString()
      .split('\n')
      .filter((line) => line.indexOf('Error: ') !== 0)
      .map((line) =>
        line
          .split(/\s+/)
          .filter((part) => {
            if (part.indexOf('.yaml') >= 0 && part.indexOf(':') < 0) return false
            return true
          })
          .map((part) => {
            if (part.indexOf('.yaml') > 0) {
              const pathParts = part.split('/')
              return pathParts[pathParts.length - 1]
            }
            return part
          })
          .join(' ')
      )
      .join('\n')
    throw new Error(message, { cause: err })
  })
  logger.trace({ action: 'renderTemplate', command: runCommand, stdout })
  return writeFile(outputTemplatePath, stdout, 'utf8')
}

/*

  render all the templates for a given deployment
  given the desired_state

   * write the merged values file from the desired_state and defaults
   * make a temp directory to write the templates
   * get a list of the .yaml templates in the deployment
   * for each template - render it and write to the temp directory

*/
const renderDeployment = async ({
  deployment_type: deploymentType,
  deployment_version: deploymentVersion,
  desired_state: desiredState,
  custom_yaml: customYaml,
}) => {
  const outputDirectory = await tmpDir()
  const inputDirectory = getTemplateFolder({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
  })
  const valuesPath = await writeTemplateValues({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
    desired_state: desiredState,
    custom_yaml: customYaml,
  })
  const templates = await getTemplates({
    deployment_type: deploymentType,
    deployment_version: deploymentVersion,
  })

  await Promise.each(templates, (templateName) =>
    renderTemplate({
      templateName,
      valuesPath,
      inputDirectory,
      outputDirectory,
    })
  ).then(() => {
    cleanUp(valuesPath)
  })

  return outputDirectory
}

module.exports = renderDeployment
