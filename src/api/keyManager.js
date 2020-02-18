/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const database = require('./database')
const ledger = require('@digitalasset/daml-ledger')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const Promise = require('bluebird')

const damRPCHost = "localhost"

const KeyManager = ({
  store,
}) => {

  if (!store) {
    throw new Error("Daml rpc requires a store")
  }

  /*

    get the list of keys from the key managers

    params:

  */
  const getKeys = async ({
    id,
    sextantPublicKey,
  } = {}) => {

    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: "daml=<name>-daml-rpc"
    })

    const pods = await proxy.getPods()
    const participantDetails = await Promise.map(pods, async pod => {
      const result = await proxy.request({
        pod: pod.metadata.name,
        port: 39000,
        handler: async ({
          port,
        }) => {
          const client = await ledger.DamlLedgerClient.connect({host: damRPCHost, port: port})
          const participantId = await client.partyManagementClient.getParticipantId();
          return {
            validator: pod.metadata.name,
            participantId: participantId.participantId
          }
        }
      })
      return result
    })

    const results = participantDetails.map( item => {
      const result = [{
        publicKey: database.getKey(),
        name: `${item.validator}`
      },{
        publicKey: database.getKey(),
        name: `${item.participantId}`
      }];
      return result
    })

    var combinedResult = results.reduce((accumulator,currentItem) => {
      return accumulator.concat(currentItem)
    })

    database.keyManagerKeys = [{
      publicKey: sextantPublicKey,
      name: 'sextant',
    }].concat(combinedResult)

    return database.keyManagerKeys
  }

  /*

    add a remote key for a deployment

    params:

     * id
     * key

  */
  const rotateRPCKey = async ({
    publicKey,
  }) => {
    if(!publicKey) throw new Error(`publicKey must be given to api.keyManager.rotateDamlRPCKey`)
    const rpc = database.keyManagerKeys.find(rpc => rpc.publicKey == publicKey)
    if(!rpc) throw new Error(`no daml RPC server with that public key found: ${publicKey}`)
    rpc.publicKey = database.getKey()
    return rpc.publicKey
  }

  return {
    getKeys,
    rotateRPCKey,
  }

}

module.exports = KeyManager
