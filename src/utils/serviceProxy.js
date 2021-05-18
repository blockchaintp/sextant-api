/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */
const Promise = require('bluebird')
const https = require('https')
const axios = require('axios')
const fs = require('fs')
const tmp = require('tmp')

const getField = require('../deployment_templates/getField')
const ClusterKubectl = require('./clusterKubectl')
const base64 = require('./base64')


const tempName = Promise.promisify(tmp.tmpName)
const writeFile = Promise.promisify(fs.writeFile)

const cachedConnections = {}

const ServiceProxy = async ({
  store,
  id,
}) => {

  let connection = cachedConnections[id]

  if(!connection) {
    const deployment = await store.deployment.get({
      id,
    })
  
    const cluster = await store.cluster.get({
      id: deployment.cluster,
    })
  
    const {
      deployment_type,
      deployment_version,
      applied_state,
    } = deployment

    const namespace = getField({
      deployment_type,
      deployment_version,
      data: applied_state,
      field: 'namespace',
    })

    const clusterKubectl = await ClusterKubectl({
      cluster,
      store,
    })

    const apiServer = clusterKubectl.remoteCredentials.apiServer
    const token = base64.decodeToString(clusterKubectl.remoteCredentials.token)
    const ca = base64.decodeToString(clusterKubectl.remoteCredentials.ca)

    const httpsAgent = new https.Agent({
      ca,
    })

    const baseUrl = `${apiServer}/api/v1/namespaces/${namespace}/services`
    const client = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      httpsAgent
    })

    connection = cachedConnections[id] = {
      token,
      apiServer,
      baseUrl,
      ca,
      namespace,
      client,
      applied_state,
    }

    // keep cached connections for 5 mins
    // this is to avoid doing multiple database + kubectl for each request
    setTimeout(() => {
      delete(cachedConnections[id])
    }, 1000 * 60 * 5)
  }

  return connection
}

module.exports = ServiceProxy
