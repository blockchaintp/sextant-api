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

  return {
    getParticipants,
    registerParticipant,
    updateKey,
  }

}

module.exports = DamlRPC