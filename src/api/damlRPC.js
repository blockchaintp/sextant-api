const jwt = require('jsonwebtoken')
const settings = require('../settings')
const database = require('./database')

const DamlRPC = () => {

  const getParticipants = ({
    
  } = {}) => {
    return database.damlParticipants
  }

  const registerParticipant = ({
    publicKey,
  }) => {
    if(!publicKey) throw new Error(`publicKey must be given to api.damlRPC.registerParticipant`)

    database.damlParticipants.push({
      damlId: database.getKey(),
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

  const addParty = ({
    publicKey,
    partyName,
  }) => {
    if(!publicKey) throw new Error(`publicKey must be given to api.damlRPC.addParty`)
    if(!partyName) throw new Error(`partyName must be given to api.damlRPC.addParty`)
    const participant = database.damlParticipants.find(participant => participant.publicKey == publicKey)
    if(!participant) throw new Error(`participant with publicKey not found: ${publicKey}`)
    const existingParty = participant.parties.find(party => party.name.toLowerCase() == partyName.toLowerCase())
    if(existingParty) throw new Error(`participant already has party with that name: ${partyName}`)
    participant.parties.push({
      name: partyName,
    })
    return true
  }

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