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
  }) => store.taekionkeys.list({
    deployment,
  })
    
  const createKey = async ({
    deployment,
    name,
  }) => {
    const key = crypto.randomBytes(32)
    const fingerprint = crypto.createHash('sha256').update(key).digest('hex')
    const result = await store.taekionkeys.create({
      deployment,
      data: {
        name,
        fingerprint,
      }
    })
    return {
      key: key.toString('hex'),
      result,
    }
  }

  const deleteKey = async ({
    deployment,
    id,
  }) => store.taekionkeys.delete({
    deployment,
    id,
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

  return {
    listKeys,
    createKey,
    deleteKey,
    listVolumes,
    createVolume,
    updateVolume,
    deleteVolume,
    listSnapshots,
    createSnapshot,
    deleteSnapshot,
  }
}

module.exports = TaekionController
