const processSnapshotResponse = (data) => data.payload.map((entry) => ({
  volume: entry.VolumeUuid,
  name: entry.Name,
  block: entry.Block,
}))

module.exports = {
  processSnapshotResponse,
}
