import { createContext } from 'sawtooth-sdk/signing'
import { PrivateKey, PublicKey } from 'sawtooth-sdk/signing/core'
import { Secp256k1PrivateKey, Secp256k1PublicKey } from 'sawtooth-sdk/signing/secp256k1'

const context = createContext('secp256k1')

const createPrivateKey = () => context.newRandomPrivateKey()
const publicKeyFromPrivateKey = (privateKey: PrivateKey) => context.getPublicKey(privateKey)

type KeyPair = {
  privateKey: PrivateKey
  publicKey: PublicKey
}
export function createKeyPair(): KeyPair {
  const privateKey = createPrivateKey()
  const publicKey = publicKeyFromPrivateKey(privateKey)
  return {
    privateKey,
    publicKey,
  }
}

export type KeyPairHex = {
  privateKey: string
  publicKey: string
}

export function binaryToHex(keyPair: { privateKey: PrivateKey; publicKey: PublicKey }): KeyPairHex {
  return {
    privateKey: keyPair.privateKey.asHex(),
    publicKey: keyPair.publicKey.asHex(),
  }
}

export function hexToBinary(keyPair: KeyPairHex): KeyPair {
  const privateKey = Secp256k1PrivateKey.fromHex(keyPair.privateKey)
  const publicKey = Secp256k1PublicKey.fromHex(keyPair.publicKey)

  return {
    privateKey,
    publicKey,
  }
}
