/*
 * Copyright © 2020 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const jwt = require('jsonwebtoken')
const ledger = require('@digitalasset/daml-ledger')
const Promise = require('bluebird')
const fs = require('fs')

const pino = require('pino')({
  name: 'damlRPC',
})
const settings = require('../settings')
const database = require('./database')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const SecretLoader = require('../utils/secretLoader')
const getField = require('../deployment_templates/getField')

const damlRPCHost = 'localhost'
const grpcOptions = { 'grpc.max_receive_message_length': -1, 'grpc.max_send_message_length': -1 }

const DamlRPC = ({
  store,
} = {}) => {
  if (!store) {
    throw new Error('Daml rpc requires a store')
  }

  const getParticipants = async ({ id }) => {
    pino.info({
      action: 'getParticipants',
      id,
    })
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: 'daml=<name>-daml-rpc',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const participantDetails = await Promise.map(pods, async (pod) => {
      const result = await proxy.request({
        pod: pod ? pod.metadata.name : null,
        port: 39000,
        handler: async ({
          port,
        }) => {
          const client = await ledger.DamlLedgerClient.connect({ host: damlRPCHost, port, grpcOptions })
          const participantId = await client.partyManagementClient.getParticipantId()
          const parties = await client.partyManagementClient.listKnownParties()
          const partyNames = parties.partyDetails.map((item) => ({
            name: item.displayName,
          }))

          const participantDetail = {
            participantId: participantId.participantId,
            damlId: `${client.ledgerId}-${pod.metadata.name}`,
            parties: partyNames,
          };
          return participantDetail
        },
      })
      return result
    })

    participantDetails[0].publicKey = database.getKey()
    return participantDetails
  }

  const registerParticipant = ({
    participantId,
    publicKey,
  }) => {
    pino.info({
      action: 'registerParticipant',
      participantId,
      publicKey,
    })
    if (!publicKey) throw new Error('publicKey must be given to api.damlRPC.registerParticipant')

    database.damlParticipants.push({
      damlId: database.getKey(),
      participantId,
      publicKey,
      parties: [],
    })

    return database.damlParticipants
  }

  const updateKey = ({
    oldPublicKey,
    newPublicKey,
  }) => {
    if (!oldPublicKey) throw new Error('oldPublicKey must be given to api.damlRPC.updateKey')
    if (!newPublicKey) throw new Error('newPublicKey must be given to api.damlRPC.updateKey')
    const participant = database.damlParticipants.find((oneParticipant) => oneParticipant.publicKey === oldPublicKey)
    if (!participant) throw new Error(`no participant found with publicKey ${oldPublicKey}`)
    participant.publicKey = newPublicKey
    return true
  }

  const addParty = async ({
    id,
    publicKey,
    partyName,
  }) => {
    pino.info({
      action: 'addParty',
      id,
      publicKey,
      partyName,
    })

    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: 'daml=<name>-daml-rpc',
    })

    let counter = 0
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const results = await Promise.map(pods, async (pod) => {
      const result = await proxy.request({
        pod: pod ? pod.metadata.name : null,
        port: 39000,
        handler: async ({
          port,
        // eslint-disable-next-line consistent-return
        }) => {
          counter += 1
          console.log(`value -> ${counter}`)
          if (counter === 1) {
            console.log(`Allocating party to ${pod.metadata.name}`)
            const client = await ledger.DamlLedgerClient.connect({ host: damlRPCHost, port, grpcOptions })
            const response = await client.partyManagementClient.allocateParty({
              partyIdHint: partyName,
              displayName: partyName,
            })
            return response.partyDetails
          }
        },
      })
      return result
    })

    if (results.length > 0) {
      return true
    }
    return false
  }

  // Removal of parties not allowed
  // Methods to be taken out
  const removeParties = ({
    publicKey,
    partyNames,
  }) => {
    if (!publicKey) throw new Error('publicKey must be given to api.damlRPC.removeParties')
    if (!partyNames) throw new Error('partyNames must be given to api.damlRPC.removeParties')
    const participant = database.damlParticipants.find((oneParticipant) => oneParticipant.publicKey === publicKey)
    if (!participant) throw new Error(`participant with publicKey not found: ${publicKey}`)
    participant.parties = participant.parties.filter((party) => partyNames.indexOf(party.name) === -1)
    return true
  }

  const generatePartyToken = async ({
    id,
    applicationId,
    readAs,
    actAs,
  }) => {
    if (!applicationId) throw new Error('applicationId must be given to api.damlRPC.generatePartyTokens')
    if (!readAs) throw new Error('readAs must be given to api.damlRPC.generatePartyTokens')
    if (!actAs) throw new Error('actAs must be given to api.damlRPC.generatePartyTokens')

    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: 'daml=<name>-daml-rpc',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const ledgerId = await proxy.request({
      pod: pods[0].metadata.name,
      port: 39000,
      handler: async ({
        port,
      }) => {
        const client = await ledger.DamlLedgerClient.connect({ host: damlRPCHost, port, grpcOptions })
        return client.ledgerId
      },
    })

    const deployment = await store.deployment.get({
      id,
    })

    const {
      deployment_type,
      deployment_version,
      applied_state,
    } = deployment

    const networkName = getField({
      deployment_type,
      deployment_version,
      data: applied_state,
      field: 'name',
    })

    const secretLoader = await SecretLoader({
      store,
      id,
    })

    const secretName = `${networkName}-jwt-cert`
    const secret = await secretLoader.getSecret(secretName)
    if(!secret || !secret.data) throw new Error(`no secret found to sign token ${secretName}`)
    const keyBase64 = secret.data['jwt.key']
    if(!keyBase64) throw new Error(`no value found to sign token ${secretName} -> ${secretField}`)

    const privateKey = Buffer.from(keyBase64, 'base64').toString('utf8')

    return new Promise((resolve, reject) => {
      jwt.sign({
        "https://daml.com/ledger-api": {
          ledgerId,
          applicationId,
          readAs,
          actAs,
        },
      // eslint-disable-next-line consistent-return
      }, privateKey, {
        algorithm: 'HS256',
      }, (err, result) => {
        if (err) return reject(err)
        resolve(result)
      })
    })
  }

  const getArchives = async ({
    id,
  } = {}) => {
    pino.info({
      action: 'getArchives',
      id,
    })

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: 'daml=<name>-daml-rpc',
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    // Extract archive information from one pod only
    // This is regardless of all validator pods
    // reaching consensus

    const result = await proxy.request({

      pod: pods[0] ? pods[0].metadata.name : null,
      port: 39000,
      handler: async ({
        port,
      }) => {
        const client = await ledger.DamlLedgerClient.connect({ host: damlRPCHost, port, grpcOptions })

        const packages = await client.packageClient.listPackages()

        const sortedPackageIds = packages.packageIds.sort()

        const data = sortedPackageIds.map((packageId) => ({
          packageId,
        }))
        return data
      },
    })
    return result
  }

  // eslint-disable-next-line no-empty-pattern
  const getTimeServiceInfo = ({} = {}) => database.damlTimeService

  const uploadArchive = async ({
    id,
    name,
    size,
    localFilepath,
  } = {}) => {
    pino.info({
      action: 'uploadArchive',
      id,
      name,
      size,
      localFilepath,
    })

    const content = fs.readFileSync(localFilepath);
    const contentBase64 = content.toString('base64');

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: 'daml=<name>-daml-rpc',
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const result = await proxy.request({
      pod: pods[0] ? pods[0].metadata.name : null,
      port: 39000,
      handler: async ({
        port,
      }) => {
        const client = await ledger.DamlLedgerClient.connect({ host: damlRPCHost, port, grpcOptions })
        await client.packageManagementClient.uploadDarFile({
          darFile: contentBase64,
        })
        const packages = await client.packageManagementClient.listKnownPackages()
        return packages
      },
    })
    return result
  }

  return {
    getParticipants,
    registerParticipant,
    updateKey,
    addParty,
    removeParties,
    generatePartyToken,
    getArchives,
    getTimeServiceInfo,
    uploadArchive,
  }
}

module.exports = DamlRPC
