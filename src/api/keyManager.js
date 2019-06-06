const database = require('./database')

const KeyManager = () => {

  /*
  
    get the local validator keys for a deployment

    params:

     * id
    
  */
  const getLocalValidatorKeys = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.getLocalValidatorKeys`)
    return database.validatorKeys
  }

  /*
  
    get the local validator keys for a deployment

    params:

     * id
    
  */
 const getLocalDamlRPCKeys = async ({
  id,
}) => {
  if(!id) throw new Error(`id must be given to controller.deployment.getLocalDamlRPCKeys`)
  return database.damlRPCKeys
}

  /*
  
    get the remote keys for a deployment

    params:

     * id
    
  */
  const getRemoteKeys = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.getRemoteKeys`)
    return database.remoteKeys
  }

  /*
  
    add a remote key for a deployment

    params:

     * id
     * key
    
  */
  const addRemoteKey = async ({
    id,
    key,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.addRemoteKey`)
    if(!key) throw new Error(`key must be given to controller.deployment.addRemoteKey`)
    database.remoteKeys.push({
      id: key
    })
    return database.remoteKeys
  }

  return {
    getLocalValidatorKeys,
    getLocalDamlRPCKeys,
    getRemoteKeys,
    addRemoteKey,
  }

}

module.exports = KeyManager