const database = require('./database')

const KeyManager = () => {

  /*
  
    get the list of keys from the key managers

    params:
    
  */
  const getKeys = async ({
    
  } = {}) => {
    return database.keyManagerKeys
  }

  

  /*
  
    add a remote key for a deployment

    params:

     * id
     * key
    
  */
  const rotateDamlRPCKey = async ({
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
    rotateDamlRPCKey,
  }

}

module.exports = KeyManager