const random = require('../utils/random')

const KeyManager = () => {
  
  const localKeys = [{
    id: random.key(),
    type: 'validator'
  },{
    id: random.key(),
    type: 'daml'
  }]

  const remoteKeys = [{
    id: random.key()
  },{
    id: random.key()
  }]

  /*
  
    get the local keys for a deployment

    params:

     * id
    
  */
  const getLocalKeys = async ({
    id,
  }) => {
    if(!id) throw new Error(`id must be given to controller.deployment.getLocalKeys`)
    return localKeys
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
    return remoteKeys
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
    remoteKeys.push({
      id: key
    })
    return remoteKeys
  }

  return {
    getLocalKeys,
    getRemoteKeys,
    addRemoteKey,
  }

}

module.exports = KeyManager