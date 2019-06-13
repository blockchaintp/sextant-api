const activated = [{
  value: true,
  title: 'Enabled'
},{
  value: false,
  title: 'Disabled'
}]

const consensus = [{
  value: 100,
  title: 'DevMode'
},{
  value: 200,
  title: 'PoET'
},{
  value: 300,
  title: 'Raft'
},{
  value: 400,
  title: 'PBFT'
}]

const peering = [{
  value: true,
  title: 'Dynamic'
},{
  value: false,
  title: 'Static'
}]

module.exports = {
  activated,
  consensus,
  peering,
}