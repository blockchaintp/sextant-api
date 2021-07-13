/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const https = require('https')
const axios = require('axios')
const deploymentConnection = require('./deploymentConnection')

const deploymentHttpConnection = async ({
  store,
  id,
  onConnection,
}) => {

  const connection = await deploymentConnection({
    store,
    id,
    onConnection,
  })

  const httpsAgent = new https.Agent({
    ca: connection.ca,
  })

  const client = axios.create({
    headers: {
      'Authorization': `Bearer ${connection.token}`,
    },
    httpsAgent
  })

  return Object.assign({}, connection, {
    client,
  })
}

module.exports = deploymentHttpConnection
