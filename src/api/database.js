const random = require('../utils/random')

// the public keys of the DAML RPC servers

const damlRPCS = [
  '891d9d25bf31bcf5f324f8104efd1a46',
  '60edca9668e2be26fc62283c42e38342',
  '5fd31ad475f6cdbdcb2078291a307911',
]

const validatorKeys = [{
  id: '00124db11117eb9ce9c0cbb9bfc215d1',
},{
  id: '16c76085faef8a77e4c899898a072c97',
},{
  id: '4dfdbf110976a064e75ce9653d360f2c',
}]

const damlRPCKeys = [{
  id: damlRPCS[0],
},{
  id: damlRPCS[1],
},{
  id: damlRPCS[2],
}]

const remoteKeys = [{
  id: 'bdfc0d9a0efac3aa0700e0838f40033c'
},{
  id: '79189464ccdd8c5b4589ae90fe3d6f29'
}]

const damlParticipants = [{
  id: '2ad9aaa4668218245f6c6a3df848faeb',
  key: damlRPCS[0],
  parties: [{
    name: 'Alice',
  }, {
    name: 'Bob',
  }]
},{
  id: '99213e227058573e3928944f855c58b2',
  key: damlRPCS[1],
  parties: [{
    name: 'Harry',
  }]
}, {
  id: '628e37332c54b59954bad58489389da9',
  key: 'f50d181a5a8cabdfa6dc31caa4bd3503',
}]

const getKey = () => random.key()

module.exports = {
  validatorKeys,
  damlRPCKeys,
  remoteKeys,
  damlParticipants,
  getKey,
}