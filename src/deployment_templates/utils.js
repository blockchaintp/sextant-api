const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const merge = require('deepmerge')
const yaml = require('js-yaml')

const readFile = Promise.promisify(fs.readFile)
const readdir = Promise.promisify(fs.readdir)

const DEFAULTS_FILE = 'defaults.yaml'


/*

  load a YAML file

*/
const getYaml = async (filepath) => {
  const yamlContent = await readFile(filepath, 'utf8')
  return yaml.safeLoad(yamlContent)
}

/*

  for a template type and version - return the folder
  in which the templates live

*/
const getTemplateFolder = ({
  deployment_type,
  deployment_version,
}) => path.resolve(__dirname, deployment_type, deployment_version)

/*

  get the path to the defaults file for a template

*/
const getDefaultsFile = ({
  deployment_type,
  deployment_version,
}) => path.resolve(getTemplateFolder({
  deployment_type,
  deployment_version,
}), DEFAULTS_FILE)

/*

  get the processed yaml for the defaults of a template of a
  given type and version

*/
const getTemplateDefaults = ({
  deployment_type,
  deployment_version,
}) => {
  const filepath = getDefaultsFile({
    deployment_type,
    deployment_version,
  })
  return getYaml(filepath)
}

/*

  merge the desired state of the deployment with the default template
  data to get deployable values

*/
const getTemplateData = async ({
  deployment_type,
  deployment_version,
  desired_state,
}) => {
  const defaults = await getTemplateDefaults({
    deployment_type,
    deployment_version,
  })
  const result = merge(defaults, desired_state)
  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.log(JSON.stringify({
    defaults,
    desired_state,
    result,
  }, null, 4))
  return result
}

module.exports = {
  getTemplateFolder,
  getTemplateData,
}