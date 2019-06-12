const random = require('../utils/random')

/*

  these values come from the sawtooth settings TP

*/
const sawtoothEnrolledKeys = []

/*

  these values come from the key manager service

*/
const keyManagerKeys = [{
  publicKey: random.key(),
  name: 'validator:1',
},{
  publicKey: random.key(),
  name: 'validator:2',
},{
  publicKey: random.key(),
  name: 'validator:3',
},{
  publicKey: random.key(),
  name: 'daml:1',
},{
  publicKey: random.key(),
  name: 'daml:2',
},{
  publicKey: random.key(),
  name: 'daml:3',
}]

const damlKeys = keyManagerKeys.filter(key => key.name.indexOf('daml:') == 0)

/*

  these values come from the DAML ledger

*/
const damlParticipants = [{
  publicKey: damlKeys[0].publicKey,
  damlId: random.key(),
  parties: [{
    name: 'Alice',
  }, {
    name: 'Bob',
  }]
},{
  publicKey: damlKeys[1].publicKey,
  damlId: random.key(),
  parties: [{
    name: 'Harry',
  }]
}, {
  publicKey: random.key(),
  damlId: random.key(),
  parties: [{
    name: 'Nigel',
  },{
    name: 'Sally',
  },{
    name: 'Tabitha',
  }]
}]

const getKey = () => random.key()

module.exports = {
  sawtoothEnrolledKeys,
  keyManagerKeys,
  damlParticipants,
  getKey,
}