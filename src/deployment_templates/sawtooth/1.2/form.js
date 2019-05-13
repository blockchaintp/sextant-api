const activatedOptions = [{
  value: 'true',
  title: 'Enabled'
},{
  value: 'false',
  title: 'Disabled'
}]

const consensusOptions = [{
  value: 'true',
  title: 'Poet'
},{
  value: 'false',
  title: 'Dev Mode'
}]

const peeringOptions = [{
  value: 'true',
  title: 'Dynamic'
},{
  value: 'false',
  title: 'Static'
}]

const form = [
  [
    {
      id: 'namespace',
      title: `Kubernetes Namespace`,
      helperText: 'The Kubernetes namespace',
      component: 'text',
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required'],
          ['matches', `^[a-zA-Z0-9]+$`, 'Only alphanumeric characters']
        ],
      },
    },
    {
      id: 'network_name',
      title: `Network Name`,
      helperText: 'The name of the sawtooth network',
      component: 'text',
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required'],
          ['matches', `^[a-zA-Z0-9]+$`, 'Only alphanumeric characters']
        ],
      },
    },
  ],

  [
    {
      id: 'dynamic_peering',
      title: `Peering Type`,
      helperText: 'Peering type for the validator',
      component: 'radio',
      row: true,
      options: peeringOptions,
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required']
        ],
      },
    },
    {
      id: 'genesis_enabled',
      title: `Genesis Block`,
      helperText: 'Should this network create the genesis block?',
      component: 'radio',
      row: true,
      options: activatedOptions,
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required']
        ],
      },
    },
  ]
]

module.exports = form