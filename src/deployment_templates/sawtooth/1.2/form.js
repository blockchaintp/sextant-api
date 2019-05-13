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

  'Network',

  [
    {
      id: 'network_name',
      title: 'Network Name',
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
    {
      id: 'namespace',
      title: 'Kubernetes Namespace',
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

  ],

  [
    {
      id: 'dynamic_peering',
      title: 'Peering Type',
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
      title: 'Genesis Block',
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
  ],

  
  {
    id: 'external_seeds',
    title: 'External Seeds',
    helperText: 'The list of external addresses to connect to',
    list: {
      mainField: 'address',
      schema: [{
        id: 'address',
        title: 'Seed address',
        helperText: 'Type the address of a new external seed (hostname:port or ip:port)',
        component: 'text',
        validate: {
          type: 'string',
          methods: [
            ['required', 'Required'],
          ],
        },
      }],
      table: [{
        title: 'Seed address',
        name: 'address',
      }]
    }
  },

  'Consensus Algorithm',

  {
    id: 'poet_enabled',
    title: 'POET Enabled',
    helperText: 'Should the POET consensus protocol be active on this network?',
    component: 'radio',
    row: true,
    options: consensusOptions,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  },

  'Transaction Processors',

  {
    id: 'custom_tps',
    title: 'Custom Transaction Processors',
    helperText: 'Custom transaction processors to start and connect to the validator on tcp://localhost:4004',
    list: {
      mainField: 'name',
      schema: [{
        id: 'name',
        title: 'Name',
        helperText: 'The name of your custom transaction processor',
        component: 'text',
        validate: {
          type: 'string',
          methods: [
            ['required', 'Required'],
          ],
        },
      },{
        id: 'image',
        title: 'Image',
        helperText: 'The docker image for your transaction processor',
        component: 'text',
        validate: {
          type: 'string',
          methods: [
            ['required', 'Required'],
          ],
        },
      },{
        id: 'command',
        title: 'Command',
        helperText: 'The command for your transaction processor',
        component: 'text',
        validate: {
          type: 'string',
          methods: [
            ['required', 'Required'],
          ],
        },
      },{
        id: 'args',
        title: 'Arguments',
        helperText: 'The arguments for your transaction processor',
        component: 'text',
        validate: {
          type: 'string',
          methods: [
            ['required', 'Required'],
          ],
        },
      }],
      table: [{
        title: 'Name',
        name: 'name',
      },{
        title: 'Image',
        name: 'image',
      },{
        title: 'Command',
        name: 'command',
      },{
        title: 'Arguments',
        name: 'args',
      }]
    }
  },

  {
    id: 'additional_tps',
    title: 'Additional Transaction Processors',
    component: 'multipleCheckbox',
    helperText: 'Choose which additional transaction processors to activate',
    options: [{
      title: 'RBAC',
      value: 'rabc',
    }, {
      title: 'XO',
      value: 'xo',
    }, {
      title: 'Smallbank',
      value: 'smallbank',
    }, {
      title: 'Simple',
      value: 'simple',
    }]
  },


]

module.exports = form