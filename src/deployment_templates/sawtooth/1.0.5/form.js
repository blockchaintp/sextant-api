const activatedOptions = [{
  value: true,
  title: 'Enabled'
},{
  value: false,
  title: 'Disabled'
}]

const consensusOptions = [{
  value: true,
  title: 'Poet'
},{
  value: false,
  title: 'Dev Mode'
}]

const peeringOptions = [{
  value: true,
  title: 'Dynamic'
},{
  value: false,
  title: 'Static'
}]

const yesNo = [{
  value: true,
  title: 'Yes'
},{
  value: false,
  title: 'No'
}]

const form = [

  'Network',

  [
    {
      id: 'sawtooth.networkName',
      title: 'Network Name',
      helperText: 'The name of the sawtooth network',
      component: 'text',
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required'],
          ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`, 'i'], 'Must follow RFC952 standards.']
        ],
      },
    },
    {
      id: 'sawtooth.namespace',
      title: 'Kubernetes Namespace',
      helperText: 'The Kubernetes namespace',
      component: 'text',
      editable: {
        new: true,
      },
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required'],
          ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`, 'i'], 'Must follow RFC952 standards.']
        ],
      },
    },

  ],

  [
    {
      id: 'sawtooth.dynamicPeering',
      title: 'Peering Type',
      helperText: 'Peering type for the validator',
      component: 'radio',
      default: true,
      dataType: 'boolean',
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
      id: 'sawtooth.genesis.enabled',
      title: 'Genesis Block',
      helperText: 'Should this network create the genesis block?',
      component: 'radio',
      default: true,
      dataType: 'boolean',
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
    id: 'sawtooth.externalSeeds',
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
    id: 'sawtooth.poet.enabled',
    title: 'Should the POET consensus protocol be active on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  },

  'Custom Transaction Processors',

  {
    id: 'sawtooth.customTPs',
    title: 'Custom transaction processors to start and connect to the validator on tcp://localhost:4004',
    helperText: 'Click add to configure.',
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

  'Smart Contract Language Support',

  [{
    id: 'sawtooth.seth.enabled',
    title: 'Should the SETH transaction processor be active on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  }],

  'Sample Applications',

  [{
    id: 'sawtooth.xo.enabled',
    title: 'Should the XO transaction processor be active on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  }, {
    id: 'sawtooth.smallbank.enabled',
    title: 'Should the Smallbank transaction processor be active on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  }],

]

module.exports = form
