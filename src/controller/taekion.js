const Promise = require('bluebird')
const crypto = require('crypto')
const utils = require('../utils/taekion')
const API = require('../api/taekion')

const TaekionController = ({ store, settings }) => {

  const api = API({
    store,
  })

  const listKeys = async ({
    deployment,
  }) => api.listKeys({
    deployment,
  })

  const createKey = async ({
    deployment,
    name,
  }) => api.createKey({
    deployment,
    name,
  })

  const listVolumes = async ({
    deployment,
  }) => api.listVolumes({
    deployment,
  })
    

  const createVolume = async ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }) => {

    if(name == 'all') throw new Error(`the name "all" is reserved for the system`)

    const data = await api.createVolume({
      deployment,
      name,
      compression,
      encryption,
      fingerprint,
    })

    return data
  }

  const updateVolume = ({
    deployment,
    volume,
    name,
  }) => 
    api.updateVolume({
      deployment,
      volume,
      name,
    })

  const deleteVolume = ({
    deployment,
    volume,
  }) => 
    api.deleteVolume({
      deployment,
      volume,
    })

  // curl http://localhost:8000/snapshot?list&volume=apples
  const listSnapshots = async ({
    deployment,
    volume,
  }) => {

    // loop over all volumes and concat the data together
    if(volume == 'all') {
      const volumes = await listVolumes({
        deployment,
      })

      const snapshotCollections = await Promise.map(volumes, async volume => {
        const snapshots = await listSnapshots({
          deployment,
          volume: volume.uuid,
        })
        return snapshots
      })

      return snapshotCollections.reduce((all, snapshotArray) => {
        return all.concat(snapshotArray)
      }, [])
    }
    else {
      const data = await api.listSnapshots({
        deployment,
        volume,
      })
      return data
    }    
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  const createSnapshot = ({
    deployment,
    volume,
    name,
  }) => 
    api.createSnapshot({
      deployment,
      volume,
      name,
    })

  const deleteSnapshot = ({
    deployment,
    id,
  }) => 
    api.deleteSnapshot({
      deployment,
      id,
    })

  const restApiProxy = ({
    deployment,
    req,
    res,
  }) => api.apiStreamRequest({
    deployment,
    // we are targeting the rest api not the taekion middleware
    podPort: 8008,
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
    restApiProxy,
  }
}

module.exports = TaekionController
