import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as util from 'util'

export const getYaml = (filepath: string): any => {
  const yamlContent = fs.readFileSync(filepath, { encoding: 'utf8' })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}

const readFileAsync = util.promisify(fs.readFile)
export const getYamlAsync = async (filepath: string) => {
  const yamlContent = await readFileAsync(filepath, { encoding: 'utf8' })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}

export const writeYaml = (filepath: string, data: unknown) => {
  const yamlText = yaml.dump(data, { schema: yaml.FAILSAFE_SCHEMA })
  return fs.writeFileSync(filepath, yamlText, { encoding: 'utf8' })
}

const writeFileAsync = util.promisify(fs.writeFile)
export const writeYamlAsync = (filepath: string, data: unknown) => {
  const yamlText = yaml.dump(data, { schema: yaml.FAILSAFE_SCHEMA })
  return writeFileAsync(filepath, yamlText, { encoding: 'utf8' })
}
