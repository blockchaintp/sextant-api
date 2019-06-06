const random = require('../utils/random')

const validatorKeys = [{
  id: random.key(),
},{
  id: random.key(),
},{
  id: random.key(),
}]

const damlRPCKeys = [{
  id: random.key(),
},{
  id: random.key(),
},{
  id: random.key(),
}]

const remoteKeys = [{
  id: random.key()
},{
  id: random.key()
}]

module.exports = {
  validatorKeys,
  damlRPCKeys,
  remoteKeys,
}