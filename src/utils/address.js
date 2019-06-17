const {createHash} = require('crypto')

const SETTINGS_NAMESPACE = '000000'
const REQUIRED_PARTS = 4
const PART_LENGTH = 16

const getHash = (value) => createHash('sha256').update(value).digest('hex')

const settings = (path) => {
  const parts = path.split('.')
  const fillParts = REQUIRED_PARTS - parts.length
  for(let i=0; i<fillParts; i++) {
    parts.push('')
  }
  const hashParts = parts.map(value => getHash(value).substring(0, PART_LENGTH))
  return [SETTINGS_NAMESPACE].concat(hashParts).join('')
}

const allowedKeys = () => settings('sawtooth.identity.allowed_keys')

const address = {
  settings,
  allowedKeys,
}

module.exports = address