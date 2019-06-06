const database = require('./database')

const DamlRPC = () => {

  const getParticipants = ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to api.damlRPC.getParticipants`)
    return database.damlParticipants
  }

  const registerParticipant = ({
    id,
    key,
  }) => {
    if(!id) throw new Error(`id must be given to api.damlRPC.registerParticipant`)
    if(!key) throw new Error(`id must be given to api.damlRPC.registerParticipant`)

    database.damlParticipants.push({
      id: database.getKey(),
      key,
      parties: [],
    })

    return database.damlParticipants
  }

  const updateKey = ({
    id,
    damlId,
    key,
  }) => {
    if(!id) throw new Error(`id must be given to api.damlRPC.updateKey`)
    if(!damlId) throw new Error(`damlId must be given to api.damlRPC.updateKey`)
    if(!key) throw new Error(`key must be given to api.damlRPC.updateKey`)
    const participant = database.damlParticipants.find(participant => participant.id == damlId)
    participant.key = key
    return true
  }

  return {
    getParticipants,
    registerParticipant,
    updateKey,
  }

}

module.exports = DamlRPC