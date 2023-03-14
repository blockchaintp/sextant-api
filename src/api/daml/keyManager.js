/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const database = require('./database')
const { DeploymentPodProxy } = require('../../utils/deploymentPodProxy')
const { DamlRPC } = require('./damlRPC')

const KeyManager = ({ store }) => {
  if (!store) {
    throw new Error('Daml rpc requires a store')
  }

  const damlRPC = new DamlRPC({
    store,
  })

  /*

    get the list of keys from the key managers

    params:

  */
  const getKeys = async ({ id, sextantPublicKey } = {}) => {
    const proxy = await DeploymentPodProxy({
      store,
      id,
      labelPattern: 'app.kubernetes.io/instance=<name>,component=daml',
    })

    const pods = await proxy.getPods()

    if (pods.length <= 0) throw new Error('The daml-rpc pod cannot be found.')

    const participantDetails = await damlRPC.getParticipantDetails({
      id,
    })

    const results = participantDetails.map((item) => {
      const result = [
        {
          publicKey: database.getKey(),
          name: `${item.validator}`,
        },
        {
          publicKey: database.getKey(),
          name: `${item.participantId}`,
        },
      ]
      return result
    })

    const combinedResult = results.reduce((accumulator, currentItem) => accumulator.concat(currentItem))

    database.keyManagerKeys = [
      {
        publicKey: sextantPublicKey,
        name: 'sextant',
      },
    ].concat(combinedResult)

    return database.keyManagerKeys
  }

  /*

    add a remote key for a deployment

    params:

     * id
     * key

  */
  const rotateRPCKey = ({ publicKey }) => {
    if (!publicKey) throw new Error('publicKey must be given to api.keyManager.rotateDamlRPCKey')
    const rpc = database.keyManagerKeys.find((oneRpc) => oneRpc.publicKey === publicKey)
    if (!rpc) throw new Error(`no daml RPC server with that public key found: ${publicKey}`)
    rpc.publicKey = database.getKey()
    return rpc.publicKey
  }

  return {
    getKeys,
    rotateRPCKey,
  }
}

module.exports = KeyManager
