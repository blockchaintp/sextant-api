/*

  wrap kubetpl to generate yaml text
  
*/

const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const exec = require('child_process').exec

// render a template given a values file and a template path
const render = (valuesPath, templatePath, done) => {

  templatePath = fullTemplatePath(templatePath)

  const runCommand = `kubetpl render -i ${valuesPath} ${templatePath}`

  exec(runCommand, {}, (err, stdout, stderr) => {
    if(err) return done(err)
    done(null, stdout.toString())
  })
}

const fullTemplatePath = (name) => path.resolve(path.join(__dirname, name))

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
