const options = require('./options')
//`^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*`
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
      options: options.peering,
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
      options: options.activated,
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required']
        ],
      },
    },
  ],
  [
    {
      id: 'sawtooth.permissioned',
      title: 'Permissioned Network',
      helperText: 'Should this network be permissioned?',
      component: 'radio',
      default: false,
      dataType: 'boolean',
      row: true,
      options: options.activated,
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required']
        ],
      },
    },
    {
      id: 'sawtooth.consensus',
      title: 'Consensus Algorithm',
      helperText: 'Which consensus algorithm should this network use?',
      component: 'select',
      default: 400,
      dataType: 'number',
      options: options.consensus,
      validate: {
        type: 'number',
        methods: [
          ['required', 'Required']
        ],
      },
    },
  ],

  {
    id: 'affinity.enabled',
    title: 'Affinity',
    helperText: 'If enabled - pods will only deploy to nodes that have the label: app={{.sawtooth.networkName}}-validator',
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: options.activated,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  },


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
    id: 'sawtooth.daml.enabled',
    title: 'Should DAML be supported on this network?',
    helperText: null,
    component: 'radio',
    default: true,
    dataType: 'boolean',
    row: true,
    options: options.yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  },{
    id: 'sawtooth.sabre.enabled',
    title: 'Should Sabre be supported on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: options.yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  },{
    id: 'sawtooth.seth.enabled',
    title: 'Should SETH be supported on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: options.yesNo,
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
    title: 'Should the XO demo be deployed on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: options.yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  }, {
    id: 'sawtooth.smallbank.enabled',
    title: 'Should the Smallbank demo be deployed on this network?',
    helperText: null,
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: options.yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  }, ''],

  'Image Pull Secrets',

  {
    id: 'imagePullSecrets.enabled',
    title: 'Do you need to enable image pull secrets?',
    helperText: 'Provide secrets to be injected into Sawtooth namespace and used to pull images from your secure registry',
    component: 'radio',
    default: false,
    dataType: 'boolean',
    row: true,
    options: options.yesNo,
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required']
      ],
    },
  }, {
    id: 'imagePullSecrets.value',
    title: 'Image Pull Secrets',
    helperText: null,
    default: null,
    list: {
      mainField: 'name',
      schema: [{
        id: 'name',
        title: 'Name',
        helperText: 'The name of the secret',
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
      }]
    }
  },


]

module.exports = form
