import yaml from 'js-yaml'
import { readFileSync, writeFileSync } from 'fs'

// eslint-disable-next-line import/prefer-default-export
export const getYaml = (filepath: string): any => {
  const yamlContent = readFileSync(filepath, 'utf8')
  return yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}

export const writeYaml = (filepath: string, data: any) => {
  const yamlText = yaml.dump(data, { schema: yaml.FAILSAFE_SCHEMA })
  return writeFileSync(filepath, yamlText, 'utf8')
}
