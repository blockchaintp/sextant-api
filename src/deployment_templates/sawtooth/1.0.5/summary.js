const summary = (values) => {

  const {
    sawtooth,
  } = values

  return [{
    title: 'Network Name',
    value: sawtooth.networkName,
  }, {
    title: 'Namespace',
    value: sawtooth.namespace,
  }, {
    title: 'Peering Type',
    value: sawtooth.dynamicPeering ? 'Dynamic' : 'Static',
  }, {
    title: 'Genesis Block',
    value: sawtooth.genesis.enabled ? 'Yes' : 'No',
  }, {
    title: 'External Seeds',
    value: sawtooth.externalSeeds.map(seed => seed.address),
  }, {
    title: 'Consensus Algorithm',
    value: sawtooth.poet.enabled ? 'POET' : 'Dev Mode',
  }, {
    title: 'Custom Transaction Processors',
    value: sawtooth.customTPs.map(tp => `${tp.name} (${tp.image})`),
  }, {
    title: 'RBAC enabled?',
    value: sawtooth.rbac.enabled ? 'Yes' : 'No',
  }, {
    title: 'SETH enabled?',
    value: sawtooth.seth.enabled ? 'Yes' : 'No',
  }, {
    title: 'XO enabled?',
    value: sawtooth.xo.enabled ? 'Yes' : 'No',
  }, {
    title: 'Smallbank enabled?',
    value: sawtooth.smallbank.enabled ? 'Yes' : 'No',
  }, {
    title: 'Simple enabled?',
    value: sawtooth.simple.enabled ? 'Yes' : 'No',
  }]
}

module.exports = summary