const {createHash} = require('crypto')

IDENTITY_NAMESPACE = '00001d'
ROLE_NAMESPACE = '01'

const getHash = (value) => createHash('sha256').update(value).digest('hex')

const identity = (path) => {
  const parts = path.split('.')
  const fillParts = 4 - parts.length
  for(let i=0; i<fillParts; i++) {
    parts.push('')
  }
  const hashParts = parts.map(value => getHash(value).substring(0, 16))
  return [IDENTITY_NAMESPACE, ROLE_NAMESPACE].concat(hashParts).join('')
}

const address = {
  identity,
}

module.exports = address