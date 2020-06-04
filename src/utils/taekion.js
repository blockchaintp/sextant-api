const processVolumeResponse = (data) => {
  const {
    payload: {
      volumes,
    }
  } = data
  return Object
    .keys(volumes)
    .map(volumeName => {
      return Object.assign({}, volumes[volumeName], {
        name: volumeName,
      })
    })
}

module.exports = {
  processVolumeResponse,
}