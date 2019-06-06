const random = require('../utils/random')

// the public keys of the DAML RPC servers
const damlRPCS = [
  random.key(),
  random.key(),
  random.key(),
]

const validatorKeys = [{
  id: random.key(),
},{
  id: random.key(),
},{
  id: random.key(),
}]

const damlRPCKeys = [{
  id: damlRPCS[0],
},{
  id: damlRPCS[1],
},{
  id: damlRPCS[2],
}]

const remoteKeys = [{
  id: random.key()
},{
  id: random.key()
}]

const damlParticipants = [{
  id: random.key(),
  key: damlRPCS[0],
  parties: [{
    name: 'Alice',
  }, {
    name: 'Bob',
  }]
}, {
  id: random.key(),
  key: random.key(),
}]

module.exports = {
  validatorKeys,
  damlRPCKeys,
  remoteKeys,
  damlParticipants,
}