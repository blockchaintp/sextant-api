const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const fullTemplatePath = (name) => path.resolve(path.join(__dirname, name))

// return a processed object from a yaml template on disk
// this is used to load the default values
const getTemplateYaml = (name) => {
  const yamlPath = fullTemplatePath(name)
  const yamlContent = fs.readFileSync(yamlPath, 'utf8')
  return yaml.safeLoad(yamlContent)
}

module.exports = {
  fullTemplatePath,
  getTemplateYaml,
}
