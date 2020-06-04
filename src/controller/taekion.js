const TaekionController = ({ store, settings }) => {

  const listKeys = async ({
    deployment,
  }) => {
    return []
  }

  const createKey = async ({
    deployment,
    keyName
  }) => {
    return {
      id: 10,
      keyName,
    }
  }

  // curl http://localhost:8000/volume?list
  const listVolumes = async ({
    deployment,
  }) => {
    return {
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
    }
  }

  // curl http://localhost:8000/volume?create=apples&compression=none&encryption=none
  const createVolume = async ({
    deployment,
    volumeName,
    compression = 'none',
    encryption,
  }) => {
    compression = compression || 'none'
    encryption = encryption || 'none'
    return {
      "action": "volume",
      "object": "volume",
      "payload": {
        "compression": "none",
        "encryption": "none",
        "fingerprint": "",
        "name": "apples"
      }
    }
  }

  // curl http://localhost:8000/snapshot?list&volume=apples
  const listSnapshots = async ({
    deployment,
    volumeName,
  }) => {
    return {
      "action": "snapshot",
      "object": "snapshot",
      "payload": {
        "Data": {
          "demoSnapshot": "02 Jan 06 15:04 MST",
          "testSnapshot": "2020-05-28 11:17:43.832029071 +0000 UTC m=+1226.288307827",
          "volume": "apples"
        }
      }
    }
  }

  // curl http://localhost:8000/snapshot?create=snapshot1&volume=apples
  const createSnapshot = async ({
    deployment,
    snapshotName,
    volumeName,
  }) => {
    return {
      "action": "snapshot",
      "object": "snapshot",
      "payload": {
        "name": "snapshot1",
        "volume": "apples"
      }
    }
  }

  return {
    listKeys,
    createKey,
    listVolumes,
    createVolume,
    listSnapshots,
    createSnapshot,
  }
}

module.exports = TaekionController
