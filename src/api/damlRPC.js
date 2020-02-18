const jwt = require('jsonwebtoken')
const settings = require('../settings')
const database = require('./database')
const ledger = require('@digitalasset/daml-ledger')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const Promise = require('bluebird')
const fs = require('fs')

const pino = require('pino')({
  name: 'damlRPC',
})

const damRPCHost = "localhost"

const DamlRPC = ({
  store,
} = {}) => {

  if (!store) {
    throw new Error("Daml rpc requires a store")
  }

  const getParticipants = async ({id}) => {

    pino.info({
      action: "getParticipants",
      id
    })
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: 'daml=<name>-daml-rpc'
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
          const participantId = await client.partyManagementClient.getParticipantId()
          const parties = await client.partyManagementClient.listKnownParties()
          const partyNames = parties.partyDetails.map(item => {
            return {
              name: item.displayName
            }
          })

          const participantDetail = {
            participantId: participantId.participantId,
            damlId: `${client.ledgerId}-${pod.metadata.name}` ,
            parties: partyNames,
          };
          return participantDetail
        }
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
      action:"registerParticipant",
      participantId,
      publicKey
    })
    if(!publicKey) throw new Error(`publicKey must be given to api.damlRPC.registerParticipant`)

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
    if(!oldPublicKey) throw new Error(`oldPublicKey must be given to api.damlRPC.updateKey`)
    if(!newPublicKey) throw new Error(`newPublicKey must be given to api.damlRPC.updateKey`)
    const participant = database.damlParticipants.find(participant => participant.publicKey == oldPublicKey)
    if(!participant) throw new Error(`no participant found with publicKey ${oldPublicKey}`)
    participant.publicKey = newPublicKey
    return true
  }

  const addParty = async ({
    id,
    publicKey,
    partyName,
  }) => {
    pino.info({
      action: "addParty",
      id,
      publicKey,
      partyName
    })

    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: "daml=<name>-daml-rpc"
    })

    var counter = 0
    const pods = await proxy.getPods()
    const results = await Promise.map(pods, async pod => {
      const result = await proxy.request({
        pod: pod.metadata.name,
        port: 39000,
        handler: async ({
          port,
        }) => {
          counter++
          console.log(`value -> ${counter}`)
          if (counter == 1) {
            console.log(`Allocating party to ${pod.metadata.name}`)
            const client = await ledger.DamlLedgerClient.connect({host: damRPCHost, port: port})
            const response = await client.partyManagementClient.allocateParty({
                partyIdHint: partyName,
                displayName: partyName
            })
            return response.partyDetails
          }
        }
      })
      return result
    })

    if (results.length > 0) {
      return true
    } else {
      return false
    }

  }

  // Removal of parties not allowed
  // Methods to be taken out
  const removeParties = ({
    publicKey,
    partyNames,
  }) => {
    if(!publicKey) throw new Error(`publicKey must be given to api.damlRPC.removeParties`)
    if(!partyNames) throw new Error(`partyNames must be given to api.damlRPC.removeParties`)
    const participant = database.damlParticipants.find(participant => participant.publicKey == publicKey)
    if(!participant) throw new Error(`participant with publicKey not found: ${publicKey}`)
    participant.parties = participant.parties.filter(party => partyNames.indexOf(party.name) == -1)
    return true
  }

  const generatePartyToken = ({
    publicKey,
    partyNames,
  }) => {
    if(!publicKey) throw new Error(`publicKey must be given to api.damlRPC.generatePartyTokens`)
    if(!partyNames) throw new Error(`partyNames must be given to api.damlRPC.generatePartyTokens`)

    return new Promise((resolve, reject) => {
      jwt.sign({
        publicKey,
        partyNames,
      }, settings.tokenSecret, (err, result) => {
        if(err) return reject(err)
        resolve(result)
      })
    })
  }

  const getArchives = async ({
    id
  } = {}) => {

    pino.info({
      action: "getArchives",
      id
    })

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: "daml=<name>-daml-rpc"
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    const extractModuleNames = (payload) => {
      return payload.getDamlLf1().getModulesList().map(a =>
          a.getName().getSegmentsList().reduce((prev, curr) => `${prev}.${curr}`)
      );
    }

    // Extract archive information from one pod only
    // This is regardless of all validator pods
    // reaching consensus
    const result = await proxy.request({
      pod: pods[0].metadata.name,
      port: 39000,
      handler: async ({
        port,
      }) => {
        const client = await ledger.DamlLedgerClient.connect({host: damRPCHost, port: port})
        const packages = await client.packageClient.listPackages()
        const mods = await Promise.map(packages.packageIds, async packageId => {
          const package = await client.packageClient.getPackage(packageId);
          const payload = await ledger.lf.ArchivePayload.deserializeBinary(package.archivePayload);
          const numberOfModules = payload.getDamlLf1().getModulesList().length
          const moduleNames = extractModuleNames(payload)
          console.log(`packageId: ${packageId} || moduleNames: ${moduleNames}`)
          return {
            packageId: packageId,
            modules: moduleNames
          }
        })
        return mods
      }
    })
    return result
  }

  const getTimeServiceInfo = ({

  } = {}) => {
    return database.damlTimeService
  }

  const uploadArchive = async ({
    id,
    name,
    size,
    localFilepath,
  } = {}) => {

    pino.info({
      action:"uploadArchive",
      id,
      name,
      size,
      localFilepath
    })

    const content = fs.readFileSync(localFilepath);
    const contentBase64 = content.toString('base64');

    // This is responsible for port forwarding
    const proxy = await DeploymentPodProxy({
      store,
      id,
      label: "daml=<name>-daml-rpc"
    })

    // We need to get all pods here
    const pods = await proxy.getPods()

    const result = await proxy.request({
      pod: pods[0].metadata.name,
      port: 39000,
      handler: async ({
        port,
      }) => {
        const client = await ledger.DamlLedgerClient.connect({host: damRPCHost, port: port})
        client.packageManagementClient.uploadDarFile({
          darFile: contentBase64
        })
        const packages = client.packageManagementClient.listKnownPackages()
        return packages
      }
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
