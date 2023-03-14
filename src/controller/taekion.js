/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-shadow */
const Promise = require('bluebird')
const { TaekionAPI } = require('../api/taekion/taekion')

const TaekionController = ({ store }) => {
  const api = new TaekionAPI({
    store,
  })

  const listKeys = ({ deployment }) =>
    api.listKeys({
      deployment,
    })

  const createKey = ({ deployment, name }) =>
    api.createKey({
      deployment,
      name,
    })

  const listVolumes = ({ deployment }) =>
    api.listVolumes({
      deployment,
    })

  const createVolume = async ({ deployment, name, compression, encryption, fingerprint }) => {
    if (name === 'all') throw new Error('the name "all" is reserved for the system')

    await api.createVolume({
      deployment,
      name,
      compression,
      encryption,
      fingerprint,
    })
  }

  const updateVolume = ({ deployment, volume, name }) =>
    api.updateVolume({
      deployment,
      volume,
      name,
    })

  const deleteVolume = ({ deployment, volume }) =>
    api.deleteVolume({
      deployment,
      volume,
    })

  // curl http://localhost:8000/snapshot?list&volume=apples
  const listSnapshots = async ({ deployment, volume }) => {
    // loop over all volumes and concat the data together
    if (volume === 'all') {
      const volumes = await listVolumes({
        deployment,
      })

      const snapshotCollections = await Promise.map(volumes, async (currentVolume) => {
        await listSnapshots({
          deployment,
          volume: currentVolume.uuid,
        })
      })

      return snapshotCollections.reduce((all, snapshotArray) => all.concat(snapshotArray), [])
    }
    return api.listSnapshots({
      deployment,
      volume,
    })
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  const createSnapshot = ({ deployment, volume, name }) =>
    api.createSnapshot({
      deployment,
      volume,
      name,
    })

  const deleteSnapshot = ({ deployment, id }) =>
    api.deleteSnapshot({
      deployment,
      id,
    })

  const explorerListDirectory = ({ deployment, volume, inode, snapshot }) =>
    api.explorerListDirectory({
      deployment,
      volume,
      inode,
      snapshot,
    })

  const explorerDownloadFile = ({
    deployment,
    volume,
    directory_inode,
    file_inode,
    download_filename,
    snapshot,
    res,
  }) =>
    api.explorerDownloadFile({
      deployment,
      volume,
      directory_inode,
      file_inode,
      download_filename,
      snapshot,
      res,
    })

  const restApiProxy = ({ deployment, req, res }) =>
    api.stlRequestProxy({
      deployment,
      // this will have the network name prepended
      // so will become "tfs-rest-api"
      serviceName: 'rest-api',
      portName: 'rest-api',
      req,
      res,
    })

  return {
    listKeys,
    createKey,
    listVolumes,
    createVolume,
    updateVolume,
    deleteVolume,
    listSnapshots,
    createSnapshot,
    deleteSnapshot,
    explorerListDirectory,
    explorerDownloadFile,
    restApiProxy,
  }
}

module.exports = TaekionController
