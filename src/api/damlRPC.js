const jwt = require('jsonwebtoken')
const settings = require('../settings')
const database = require('./database')
const ledger = require('@digitalasset/daml-ledger')
const DeploymentPodProxy = require('../utils/deploymentPodProxy')
const Promise = require('bluebird')

const damRPCHost = "localhost"

const DamlRPC = ({
  store,
} = {}) => {

  if (!store) {
    throw new Error("Daml rpc requires a store")
  }

  const getParticipants = async ({id}) => {

    console.log(`********************************************`)
    console.log(`***          Get Participants            ***`)
    console.log(`********************************************`)

    const proxy = await DeploymentPodProxy({
      store,
      id,
    })

    const pods = await proxy.getPods()
    const participantDetails = await Promise.map(pods, async pod => {
      const result = await proxy.request({
        pod: pod.metadata.name,
        port: 39000,
        handler: async ({
          port,
        }) => {
          console.log('-------------------------------------------------------------')
          console.log(`Forwarded port: "${port}" for pod name "${pod.metadata.name}"`)
          console.log('-------------------------------------------------------------')
          const client = await ledger.DamlLedgerClient.connect({host: damRPCHost, port: port})
          const participantId = await client.partyManagementClient.getParticipantId();
          const parties = await client.partyManagementClient.listKnownParties();
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
    
    const participantKeys = database.keyManagerKeys
    const updatedDetails = participantDetails.map( (pD) => {
      const filteredKeys = participantKeys.filter( (pK) => {
        return pK.name == pD.participantId
      })
      pD.publicKey = filteredKeys[0].publicKey
      return pD
    })
    return updatedDetails
  }

  const registerParticipant = ({
    participantId,
    publicKey,
  }) => {

    console.log(`********************************************`)
    console.log(`***         Register Participants        ***`)
    console.log(`********************************************`)

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

    console.log(`********************************************`)
    console.log(`***        Add Party                     ***`)
    console.log(`********************************************`)

    const proxy = await DeploymentPodProxy({
      store,
      id,
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
                partyIdHint: database.getToken(),
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

  const getArchives = ({

  } = {}) => {
    return database.damlArchives
  }

  const getTimeServiceInfo = ({

  } = {}) => {
    return database.damlTimeService
  }

  const uploadArchive = ({
    name,
    size,
  } = {}) => {
    const archive = {
      packageid: name,
      size,
      uploadedBy: database.damlParticipants[0].publicKey,
      uploaded: new Date().getTime(),
    }
    database.damlArchives.push(archive)
    return database.damlArchives
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