const processVolumeResponse = (data) => {
  return data.payload.reduce((all, entry) => {
    return all.concat(Object.keys(entry).map(name => {
      const data = entry[name]
      return Object.assign({}, data, {
        name,
      })
    }))
  }, [])
}

const processSnapshotResponse = (data) => data.payload.map(entry => {
  return {
    volume: entry.VolumeUuid,
    name: entry.Name,
    block: entry.Block,
  }
})

module.exports = {
  processVolumeResponse,
  processSnapshotResponse,
}