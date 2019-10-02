const options = require('./options')
//`^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*`
const form = [

  'Network',

  [
    {
      id: 'deployment.networkName',
      title: 'Network Name',
      helperText: 'The name of the DAML on Aurora Deployment',
      component: 'text',
      validate: {
        type: 'string',
        methods: [
          ['required', 'Required'],
          ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`], "a DNS-1123 label must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character"]
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
          ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`], "a DNS-1123 label must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character"]
        ],
      },
    },

  ],

  'DAML Details',
  [{
    id: 'daml.postgres.secret',
    title: 'Database DB Connection Secret',
    helperText: 'The name of the secret containing the database connection details and credentials',
    component: 'text',
    editable: {
      new: true,
    },
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required'],
        ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`], "a DNS-1123 label must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character"]
      ],
    },
  },{
    id: 'daml.postgres.ledgerId',
    title: 'DAML Ledger ID',
    helperText: 'A unique string identying this ledger',
    component: 'text',
    editable: {
      new: true,
    },
    validate: {
      type: 'string',
      methods: [
        ['required', 'Required'],
        ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`], "a DNS-1123 label must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character"]
      ],
    },
  },],

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
            ['matches', [`^[a-z]([-a-z0-9]*[a-z0-9])*$`], "a DNS-1123 label must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character"]
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
