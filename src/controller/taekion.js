const Promise = require('bluebird')
const crypto = require('crypto')
const utils = require('../utils/taekion')
const API = require('../api/taekion')

const FIXTURES = {
  listVolumes: {
    "action": "volume",
    "object": "volume",
    "payload": {
      "volumes": {
        "exampleVol0": {
          "compression": "LZ4",
          "encryption": "AES-GCM",
          "fingerprint": "2a97516c354b68848cdbd8f54a226a0a55b21ed138e207ad6c5cbb9c00aa5aea"
        },
        "exampleVol1": {
          "compression": "none",
          "encryption": "none",
          "fingerprint": "none"
        }
      }
    }
  },
  createVolume: {
    "action": "volume",
    "object": "volume",
    "payload": {
      "compression": "none",
      "encryption": "none",
      "fingerprint": "",
      "name": "apples"
    }
  },
  listSnapshots: {
    "action": "snapshot",
    "object": "snapshot",
    "payload": {
      "Data": {
        "demoSnapshot": "02 Jan 06 15:04 MST",
        "testSnapshot": "2020-05-28 11:17:43.832029071 +0000 UTC m=+1226.288307827",
        "volume": "apples"
      }
    }
  },
  createSnapshot: {
    "action": "snapshot",
    "object": "snapshot",
    "payload": {
      "name": "snapshot1",
      "volume": "apples"
    }
  },
}

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
  }) => {

    const data = await api.listVolumes({
      deployment,
    })

    return utils.processVolumeResponse(data)
  }

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

  const updateVolume = async ({
    deployment,
    name,
    compression,
    encryption,
    fingerprint,
  }) => {

    const data = await api.updateVolume({
      deployment,
      name,
      compression,
      encryption,
      fingerprint,
    })

    return data
  }


  const deleteVolume = async ({
    deployment,
    name,
  }) => {

    const data = await api.deleteVolume({
      deployment,
      name,
    })

    return data
  }

  // curl http://localhost:8000/snapshot?list&volume=apples
  const listSnapshots = async ({
    deployment,
    volumeName,
  }) => {

    // loop over all volumes and concat the data together
    if(volumeName == 'all') {
      const volumes = await listVolumes({
        deployment,
      })

      const snapshotCollections = await Promise.map(volumes, async volume => {
        const snapshots = await listSnapshots({
          deployment,
          volumeName: volume.name,
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
        volume: volumeName,
      })

      return utils.processSnapshotResponse(data)
    }    
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  const createSnapshot = async ({
    deployment,
    snapshotName,
    volumeName,
  }) => {

    const data = await api.createSnapshot({
      deployment,
      volume: volumeName,
      name: snapshotName,
    })

    return data
  }

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
  }
}

module.exports = TaekionController
