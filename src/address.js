const address = require('./utils/address')

const value = address.settings('sawtooth.identity.allowed_keys')

console.log(value)