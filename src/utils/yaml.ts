import * as fs from 'fs'
import * as yaml from 'js-yaml'

export const getYaml = (filepath: string): any => {
  const yamlContent = fs.readFileSync(filepath, 'utf8')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}
