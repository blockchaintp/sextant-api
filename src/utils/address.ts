import { createHash, BinaryLike } from 'crypto'

const SETTINGS_NAMESPACE = '000000'
const REQUIRED_PARTS = 4
const PART_LENGTH = 16

const getHash = (value: BinaryLike) => createHash('sha256').update(value).digest('hex')

export const settings = (path: string) => {
  const parts = path.split('.')
  const fillParts = REQUIRED_PARTS - parts.length
  for (let i = 0; i < fillParts; i += 1) {
    parts.push('')
  }
  const hashParts = parts.map((value: BinaryLike) => getHash(value).substring(0, PART_LENGTH))
  return [SETTINGS_NAMESPACE].concat(hashParts).join('')
}

export const allowedKeys = () => settings('sawtooth.identity.allowed_keys')

// const address = {
//   settings,
//   allowedKeys,
// }

// module.exports = address
