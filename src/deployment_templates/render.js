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
const tempName = Promise.promisify(tmp.tmpName)
const tmpDir = Promise.promisify(tmp.dir)
const exec = Promise.promisify(childProcess.exec)

const pino = require('pino')({
  name: 'render.js',
})

const DEFAULTS_FILE = 'defaults.yaml'

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray


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
  const initialData = merge(defaults, desired_state, { arrayMerge: overwriteMerge })

  const initialCustomTPs = initialData.sawtooth.customTPs

  const formatedCustomTPs = initialCustomTPs.map( (tp) => {
    return {
      id: tp.id,
      index: tp.index,
      name: tp.name,
      image: tp.image,
      command: tp.command.split(' '),
      args: tp.args.split(' '),
      }
    })
  
  initialData.sawtooth.customTPs = formatedCustomTPs
  const formatedData = initialData
  
  return formatedData
  
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
  const valuesPath = await tempName({
    postfix: '.yaml',
  })

  const templateData = await getTemplateData({
    deployment_type,
    deployment_version,
    desired_state,
    custom_yaml,
  })

  // parse string into yaml object
  const customYaml = yaml.safeLoad(custom_yaml)

  // merge yaml from the form input with custom yaml input
  // TODO  - error handling for custom yaml

  const mergedYamlData = merge(templateData, customYaml, { arrayMerge: overwriteMerge })

  await writeYaml(valuesPath, mergedYamlData)

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
  }).sort()
}

/*

  get the result of a template render

*/

const cleanUp = async (filePath) => {
  await fs.unlink(filePath, (err) => {
    pino.info({
      action: 'unlinkFile',
      filepath: filePath
    })
  })
}

const renderTemplate = async ({
  templateName,
  valuesPath,
  inputDirectory,
  outputDirectory,
}) => {
  const inputTemplatePath = path.resolve(inputDirectory, templateName)
  const outputTemplatePath = path.resolve(outputDirectory, templateName)
  const runCommand = `kubetpl render -i ${valuesPath} ${inputTemplatePath}`
  const stdout = await exec(runCommand)
    .catch(err => {
      // make the kubetpl error message nicely readable
      err.message = err
        .toString()
        .split("\n")
        .filter(line => line.indexOf('Error: ') == 0 ? false : true)
        .map(line => {
          return line
            .split(/\s+/)
            .filter(part => {
              if(part.indexOf('.yaml') >= 0 && part.indexOf(':') < 0) return false
              return true
            })
            .map(part => {
              if(part.indexOf('.yaml') > 0) {
                const pathParts = part.split('/')
                return pathParts[pathParts.length-1]
              }
              else {
                return part
              }
            }).join(' ')
        })
        .join("\n")
      throw err
    })
  const retFile=await writeFile(outputTemplatePath, stdout, 'utf8')
  return retFile
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
  custom_yaml,
}) => {
  const outputDirectory = await tmpDir()
  const inputDirectory = getTemplateFolder({
    deployment_type,
    deployment_version,
  })
  const valuesPath = await writeTemplateValues({
    deployment_type,
    deployment_version,
    desired_state,
    custom_yaml,
  })
  const templates = await getTemplates({
    deployment_type,
    deployment_version,
  })

  await Promise.each(templates, templateName => renderTemplate({
    templateName,
    valuesPath,
    inputDirectory,
    outputDirectory,
  })).then(() => {
    cleanUp(valuesPath)
  })

  return outputDirectory
}

module.exports = renderDeployment
