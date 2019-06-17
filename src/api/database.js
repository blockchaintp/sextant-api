const random = require('../utils/random')
const secp256k1 = require('../utils/secp256k1')

const getKey = () => secp256k1.binaryToHex(secp256k1.createKeyPair()).publicKey

/*

  these values come from the sawtooth settings TP

*/
const sawtoothEnrolledKeys = []

/*

  these values come from the key manager service

*/
const keyManagerKeys = [{
  publicKey: getKey(),
  name: 'validator:1',
},{
  publicKey: getKey(),
  name: 'validator:2',
},{
  publicKey: getKey(),
  name: 'validator:3',
},{
  publicKey: getKey(),
  name: 'daml:1',
},{
  publicKey: getKey(),
  name: 'daml:2',
},{
  publicKey: getKey(),
  name: 'daml:3',
}]

const damlKeys = keyManagerKeys.filter(key => key.name.indexOf('daml:') == 0)

/*

  these values come from the DAML ledger

*/
const damlParticipants = [{
  publicKey: damlKeys[0].publicKey,
  damlId: getKey(),
  parties: [{
    name: 'Alice',
  }, {
    name: 'Bob',
  }]
},{
  publicKey: damlKeys[1].publicKey,
  damlId: getKey(),
  parties: [{
    name: 'Harry',
  }]
}, {
  publicKey: getKey(),
  damlId: random.string(),
  parties: [{
    name: 'Nigel',
  },{
    name: 'Sally',
  },{
    name: 'Tabitha',
  }]
}]

const damlArchives = [{
  packageid: '3ab37fe8d_some.daml.package',
  size: 3123987,
  uploadedBy: damlParticipants[0].publicKey,
  uploaded: new Date().getTime(),
}]

const damlTimeService = [{
  publicKey: damlParticipants[0].publicKey,
  lastClockUpdate: new Date().getTime(),
}]

module.exports = {
  sawtoothEnrolledKeys,
  keyManagerKeys,
  damlParticipants,
  damlArchives,
  damlTimeService,
  getKey,
}