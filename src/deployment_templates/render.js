const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const merge = require('deepmerge')
const yaml = require('js-yaml')
const tmp = require('tmp')
const childProcess = require('child_process')

const readFile = Promise.promisify(fs.readFile)
const readdir = Promise.promisify(fs.readdir)
const writeFile = Promise.promisify(fs.writeFile)
const tempFile = Promise.promisify(tmp.file)
const tmpDir = Promise.promisify(tmp.dir)
const exec = Promise.promisify(childProcess.exec, {
  multiArgs: true,
})

const DEFAULTS_FILE = 'defaults.yaml'


/*

  load a YAML file

*/
const getYaml = async (filepath) => {
  const yamlContent = await readFile(filepath, 'utf8')
  return yaml.safeLoad(yamlContent)
}

/*

  write a YAML file

*/
const writeYaml = async (filepath, data) => {
  const yamlText = yaml.safeDump(data)
  return writeFile(filepath, yamlText, 'utf8')
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
  return merge(defaults, desired_state)
}

/*

  merge the desired state of the deployment
  with the template defaults and write a yaml file
  to a temporary location

  return the filepath to the values.yaml

*/
const writeTemplateValues = async ({
  deployment_type,
  deployment_version,
  desired_state,
}) => {
  const valuesPath = await tempFile({
    postfix: '.yaml',
  })

  const templateData = await getTemplateData({
    deployment_type,
    deployment_version,
    desired_state,
  })

  await writeYaml(valuesPath, templateData)

  return valuesPath
}

/*

  get a list of the templates for a deployment / version
  this will resolve any .yaml file in the template folder
  exclude `defaults.yaml`

*/
const getTemplates = async ({
  deployment_type,
  deployment_version,
}) => {
  const templateFolder = getTemplateFolder({
    deployment_type,
    deployment_version,
  })
  const files = await readdir(templateFolder)

  return files.filter(filename => {
    if(!filename.match(/\.yaml$/)) return false
    if(filename == DEFAULTS_FILE) return false
    return true
  })
}

/*

  get the result of a template render

*/
const renderTemplate = async ({
  templateName,
  valuesPath,
  inputDirectory,
  outputDirectory,
}) => {
  const inputTemplatePath = path.resolve(inputDirectory, templateName)
  const outputTemplatePath = path.resolve(outputDirectory, templateName)
  const runCommand = `kubetpl render -i ${valuesPath} ${inputTemplatePath}`
  const [ stdout, stderr ] = await exec(runCommand)
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
const renderDeployment = async({
  deployment_type,
  deployment_version,
  desired_state,
}) => {
  const outputDirectory = await tmpDir()
  const valuesPath = await writeTemplateValues({
    deployment_type,
    deployment_version,
    desired_state,
  })

  return {
    outputDirectory,
    valuesPath,
  }
}

module.exports = renderDeployment