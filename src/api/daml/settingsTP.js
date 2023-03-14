/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-var-requires */
const database = require('./database')

const SettingsTP = () => {
  /*

    get the local validator keys for a deployment

    params:

     * id

  */
  const getEnrolledKeys = () => database.sawtoothEnrolledKeys

  /*

    add a remote key for a deployment

    params:

     * id
     * key

  */
  const addEnrolledKey = ({ publicKey }) => {
    if (!publicKey) throw new Error('publicKey must be given to api.settingsTP.addEnrolledKey')
    database.sawtoothEnrolledKeys.push({
      publicKey,
    })
    return database.sawtoothEnrolledKeys
  }

  return {
    getEnrolledKeys,
    addEnrolledKey,
  }
}

module.exports = SettingsTP
