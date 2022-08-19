import yaml from 'js-yaml'
import { readFileSync, writeFileSync } from 'fs'
import { tmpName } from 'tmp-promise'
import Logging from '../logging'

const logger = Logging.getLogger({ name: 'utils/yaml' })

export function safeLoad(yamlContent: string) {
  return yaml.load(yamlContent, { schema: yaml.FAILSAFE_SCHEMA })
}

export function safeDump(data: any) {
  return yaml.dump(data, { schema: yaml.FAILSAFE_SCHEMA })
}

export const getYaml = (filepath: string): any => {
  const yamlContent = readFileSync(filepath, 'utf8')
  return safeLoad(yamlContent)
}

export const writeYaml = (filepath: string, data: any) => {
  const yamlText = safeDump(data)
  return writeFileSync(filepath, yamlText, 'utf8')
}

export const writeTempYaml = async (data: unknown) => {
  const tmpPath = await tmpName({ postfix: '.yaml' })
  writeYaml(tmpPath, data)
  logger.debug({ message: `Wrote - ${tmpPath}` })
  return tmpPath
}
