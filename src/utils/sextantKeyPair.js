const secp256k1 = require('./secp256k1')
const base64 = require('./base64')

const logger = require('../logging').getLogger({
  name: 'utils/sextantKeyPair',
})

const create = async ({
  store,
  deployment,
}, trx) => {
  const keyPair = secp256k1.binaryToHex(secp256k1.createKeyPair())
  return store.deploymentsecret.create({
    data: {
      deployment,
      name: 'sextantKeypair',
      rawData: JSON.stringify(keyPair),
    },
  }, trx)
}

// load the sextant keypair for a deployment
const get = async ({
  store,
  deployment,
}, trx) => {
  const secret = await store.deploymentsecret.get({
    deployment,
    name: 'sextantKeypair',
  }, trx)
  logger.trace({ secret }, 'Sextant KeyPair fetched')
  return JSON.parse(base64.decode(secret.base64data))
}

module.exports = {
  create,
  get,
}
