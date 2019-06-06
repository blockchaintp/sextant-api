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
    if(!id) throw new Error(`id must be given to api.keyManager.getLocalValidatorKeys`)
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
  if(!id) throw new Error(`id must be given to api.keyManager.getLocalDamlRPCKeys`)
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
    if(!id) throw new Error(`id must be given to api.keyManager.getRemoteKeys`)
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
    if(!id) throw new Error(`id must be given to api.keyManager.addRemoteKey`)
    if(!key) throw new Error(`key must be given to api.keyManager.addRemoteKey`)
    database.remoteKeys.push({
      id: key
    })
    return database.remoteKeys
  }

  /*
  
    add a remote key for a deployment

    params:

     * id
     * key
    
  */
  const rotateLocalDamlRPCKey = async ({
    id,
    key,
  }) => {
    if(!id) throw new Error(`id must be given to api.keyManager.rotateLocalDamlRPCKey`)
    if(!key) throw new Error(`key must be given to api.keyManager.rotateLocalDamlRPCKey`)
    const rpc = database.damlRPCKeys.find(rpc => rpc.id == key)
    rpc.id = database.getKey()
    return rpc.id
  }

  return {
    getLocalValidatorKeys,
    getLocalDamlRPCKeys,
    getRemoteKeys,
    addRemoteKey,
    rotateLocalDamlRPCKey,
  }

}

module.exports = KeyManager