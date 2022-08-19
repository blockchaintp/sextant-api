const secp256k1 = require('../utils/secp256k1')

const getKey = () => secp256k1.binaryToHex(secp256k1.createKeyPair()).publicKey
const getToken = () => secp256k1.binaryToHex(secp256k1.createKeyPair()).publicKey

/*

  these values come from the sawtooth settings TP

*/
const sawtoothEnrolledKeys = []

/*

  these values come from the key manager service

*/
const keyManagerKeys = [
  {
    publicKey: getKey(),
    name: 'validator:1',
  },
  {
    publicKey: getKey(),
    name: 'validator:2',
  },
  {
    publicKey: getKey(),
    name: 'validator:3',
  },
  {
    publicKey: getKey(),
    name: 'daml:1',
  },
  {
    publicKey: getKey(),
    name: 'daml:2',
  },
  {
    publicKey: getKey(),
    name: 'daml:3',
  },
]

const damlKeys = keyManagerKeys.filter((key) => key.name.indexOf('daml:') === 0)

/*

  these values come from the DAML ledger

*/
const damlParticipants = [
  {
    publicKey: damlKeys[0].publicKey,
    participantId: '123',
    damlId: getKey(),
    parties: [
      {
        name: 'Alice',
      },
      {
        name: 'Bob',
      },
    ],
  },
]

const damlArchives = [
  {
    packageid: '3ab37fe8d_some.daml.package',
    size: 3123987,
    uploadedBy: getKey(),
    uploaded: new Date().getTime(),
  },
]

const damlTimeService = [
  {
    publicKey: getKey(),
    lastClockUpdate: new Date().getTime(),
  },
]

module.exports = {
  sawtoothEnrolledKeys,
  keyManagerKeys,
  damlParticipants,
  damlArchives,
  damlTimeService,
  getKey,
  getToken,
}
