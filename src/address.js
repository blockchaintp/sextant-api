/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const address = require('./utils/address')

const value = address.settings('sawtooth.identity.allowed_keys')

console.log(value)
