/*

  wrap kubetpl to generate yaml text
*/
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import * as cp from 'child_process'

// render a template given a values file and a template path
export const fullTemplatePath = (name: string) => path.resolve(path.join(__dirname, name))

export const render = (valuesPath: string, templatePath: string) => {
  const fullPath = fullTemplatePath(templatePath)

  const runCommand = `kubetpl render -i ${valuesPath} ${fullPath}`

  const cpResponse = cp.spawnSync(runCommand, { shell: false })
  if (cpResponse.status !== 0) return cpResponse.error || null
  return cpResponse.stdout.toString()
}

// return a processed object from a yaml template on disk
// this is used to load the default values
export const getTemplateYaml = (name: string) => {
  const yamlPath = fullTemplatePath(name)
  const yamlContent = fs.readFileSync(yamlPath, 'utf8')
  return yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}
