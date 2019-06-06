const database = require('./database')

const DamlRPC = () => {

  const getParticipants = ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to api.damlRPC.getParticipants`)
    return database.damlParticipants
  }

  return {
    getParticipants,
  }

}

module.exports = DamlRPC