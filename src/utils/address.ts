import { createHash } from 'crypto'

const SETTINGS_NAMESPACE = '000000'
const REQUIRED_PARTS = 4
const PART_LENGTH = 16

function getHash(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function settings(path: string) {
  const parts = path.split('.')
  const fillParts = REQUIRED_PARTS - parts.length
  for (let i = 0; i < fillParts; i++) {
    parts.push('')
  }
  const hashParts = parts.map((value) => getHash(value).substring(0, PART_LENGTH))
  return [SETTINGS_NAMESPACE].concat(hashParts).join('')
}

export function allowedKeys() {
  return settings('sawtooth.identity.allowed_keys')
}
