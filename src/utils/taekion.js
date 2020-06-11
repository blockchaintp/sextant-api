const processVolumeResponse = (data) => {
  const {
    payload: {
      volumes,
    }
  } = data
  return Object
    .keys(volumes)
    .map(volumeName => {

      const volume = volumes[volumeName]
      return Object.assign({}, volume, {
        name: volumeName,
        encryption: volume.encryption == 'AES-GCM' ?
          'AES_GCM' :
          volume.encryption,
      })
    })
}

const processSnapshotResponse = (data) => {
  const {
    payload: {
      Data,
    }
  } = data
  const volume = Data.volume
  return Object
    .keys(Data)
    .reduce((all, key) => {
      if(key == 'volume') return all
      return all.concat([{
        volume,
        name: key,
        date: Data[key].replace(/ m\=.*?$/, ''),
      }])
    }, [])
}


module.exports = {
  processVolumeResponse,
  processSnapshotResponse,
}