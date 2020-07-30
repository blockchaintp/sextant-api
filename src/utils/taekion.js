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

const processSnapshotResponse = (data) => data.payload

module.exports = {
  processVolumeResponse,
  processSnapshotResponse,
}