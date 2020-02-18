/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const { createContext } = require('sawtooth-sdk/signing')
const { Secp256k1PrivateKey } = require('sawtooth-sdk/signing/secp256k1')
const context = createContext('secp256k1')

const createPrivateKey = () => context.newRandomPrivateKey()
const publicKeyFromPrivateKey = (privateKey) => context.getPublicKey(privateKey)
const privateKeyFromHex = (privateKeyHex) => Secp256k1PrivateKey.fromHex(privateKeyHex)

const createKeyPair = () => {
  const privateKey = createPrivateKey()
  const publicKey = publicKeyFromPrivateKey(privateKey)
  return {
    privateKey: privateKey.privateKeyBytes,
    publicKey: publicKey.publicKeyBytes,
  }
}

const binaryToHex = (keyPair) => {
  return {
    privateKey: keyPair.privateKey.toString('hex'),
    publicKey: keyPair.publicKey.toString('hex'),
  }
}

const hexToBinary = (keyPair) => {
  const privateKey = privateKeyFromHex(keyPair.privateKey)
  const publicKey = publicKeyFromPrivateKey(privateKey)

  return {
    privateKey,
    publicKey,
  }
}

const utils = {
  createKeyPair,
  binaryToHex,
  hexToBinary,
}

module.exports = utils
