const { createContext } = require('sawtooth-sdk/signing')
const { Secp256k1PrivateKey } = require('sawtooth-sdk/signing/secp256k1')
const context = createContext('secp256k1')

const createPrivateKey = () => context.newRandomPrivateKey()
const publicKeyFromPrivateKey = (privateKey) => context.getPublicKey(privateKey)

const createKeyPair = () => {
  const privateKey = createPrivateKey()
  const publicKey = publicKeyFromPrivateKey(privateKey)

  return {
    privateKey,
    publicKey,
  }
}

const utils = {
  load,
  save,
  create,
  privateKeyFromHex,
  publicKeyFromPrivateKey,
}

module.exports = utils