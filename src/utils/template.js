/*

  wrap kubetpl to generate yaml text
*/

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const cp = require('child_process')

// render a template given a values file and a template path

const fullTemplatePath = (name) => path.resolve(path.join(__dirname, name))

const render = (valuesPath, templatePath) => {
  templatePath = fullTemplatePath(templatePath)

  const runCommand = `kubetpl render -i ${valuesPath} ${templatePath}`

  const cpResponse = cp.spawnSync(runCommand, { shell: false })
  if (cpResponse.status !== 0) return cpResponse.error || null
  return cpResponse.stdout.toString()
}

// return a processed object from a yaml template on disk
// this is used to load the default values
const getTemplateYaml = (name) => {
  const yamlPath = fullTemplatePath(name)
  const yamlContent = fs.readFileSync(yamlPath, 'utf8')
  return yaml.safeLoad(yamlContent)
}

module.exports = {
  render,
  fullTemplatePath,
  getTemplateYaml,
}
