const activatedOptions = [{
  value: true,
  title: 'Enabled'
},{
  value: false,
  title: 'Disabled'
}]

const consensusOptions = [{
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

const peeringOptions = [{
  value: true,
  title: 'Dynamic'
},{
  value: false,
  title: 'Static'
}]

const form = [

  'Network',

  [
    {
      id: 'deployment.name',
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
      id: 'deployment.namespace',
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
          ['matches', `^[a-zA-Z0-9]+$`, 'Only alphanumeric characters']
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
    {
      id: 'sawtooth.permissioned',
      title: 'Permissioned Network',
      helperText: 'Should this network be permissioned?',
      component: 'radio',
      default: false,
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
    title: 'PoET Enabled',
    helperText: 'Should the PoET consensus protocol be active on this network?',
    component: 'radio',
    default: false,
    dataType: 'string',
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
    id: 'sawtooth.customTPs',
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
  [{
    id: 'sawtooth.devmode.enabled',
    title: 'DevMode Engine Enabled',
    helperText: 'Should the DevMode Engine be active on this network?',
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
  },{
    id: 'sawtooth.poet.enabled',
    title: 'PoET Engine Enabled',
    helperText: 'Should the PoET Engine be active on this network?',
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
  },{
    id: 'sawtooth.raft.enabled',
    title: 'Raft Engine Enabled',
    helperText: 'Should the Raft Engine be active on this network?',
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
  },{
    id: 'sawtooth.pbft.enabled',
    title: 'PBFT Engine Enabled',
    helperText: 'Should the PBFT Engine be active on this network?',
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
  }],

  [{
    id: 'sawtooth.sabre.enabled',
    title: 'Sabre Enabled',
    helperText: 'Should the Sabre transaction processor be active on this network?',
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
  },{
    id: 'sawtooth.seth.enabled',
    title: 'SETH Enabled',
    helperText: 'Should the SETH transaction processor be active on this network?',
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
  }], [{
    id: 'sawtooth.xo.enabled',
    title: 'XO Enabled',
    helperText: 'Should the XO transaction processor be active on this network?',
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
  }, {
    id: 'sawtooth.smallbank.enabled',
    title: 'Smallbank Enabled',
    helperText: 'Should the Smallbank transaction processor be active on this network?',
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
  }],


]

module.exports = form