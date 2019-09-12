const activated = [{
  value: true,
  title: 'Enabled'
},{
  value: false,
  title: 'Disabled'
}]

const yesNo = [{
  value: true,
  title: 'Yes'
},{
  value: false,
  title: 'No'
}]

const consensus = [{
  value: 100,
  title: 'DevMode'
},{
  value: 400,
  title: 'PBFT'
},{
  value: 200,
  title: 'PoET'
},{
  value: 300,
  title: 'Raft'
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
  yesNo
}
