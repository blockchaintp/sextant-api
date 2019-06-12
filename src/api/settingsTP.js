const database = require('./database')

const SettingsTP = () => {

  /*
  
    get the local validator keys for a deployment

    params:

     * id
    
  */
  const getEnrolledKeys = async ({
    
  } = {}) => {
    return database.sawtoothEnrolledKeys
  }

  /*
  
    add a remote key for a deployment

    params:

     * id
     * key
    
  */
  const addEnrolledKey = async ({
    publicKey,
  }) => {
    if(!publicKey) throw new Error(`publicKey must be given to api.settingsTP.addEnrolledKey`)
    database.sawtoothEnrolledKeys.push({
      publicKey: key
    })
    return database.sawtoothEnrolledKeys
  }

  return {
    getEnrolledKeys,
    addEnrolledKey,
  }

}

module.exports = SettingsTP