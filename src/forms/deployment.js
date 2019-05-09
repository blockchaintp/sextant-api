const builder = require('./builder')

const validators = {
  url: [
    'matches', 
    '^(?:([a-z0-9+.-]+):\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*\\.?)(?::\\d{2,5})?(?:[/?#]\\S*)?$',
    'Must be a valid url - e.g. http://apiserver.com'
  ],
  ca: [
    'matches', 
    ['^-----BEGIN CERTIFICATE-----.*-----END CERTIFICATE-----$', 's'],
    {
      message: 'Must be a valid certificate',
      excludeEmptyString: true,
    },
  ]
}

const fields = {
  name: {
    id: 'name',
    title: `Name`,
    helperText: 'Enter the name of the deployment',
    component: 'text',
    validate: {
      type: 'string',
      methods: [],
    },
  },
}

const getSawtoothForm = (required) => {
  return builder({
    fields,
    schema: [
      'name',
    ],
    required,
  })
}

const getEthereumForm = (required) => {
  return builder({
    fields,
    schema: [
      'name',
    ],
    required,
  })
}

const forms = {
  validators,
  fields,
  browser: {
    sawtooth: {
      add: getSawtoothForm([
        'name',
      ]),
      edit: getSawtoothForm([
        'name',
      ]),
    },
    ethereum: {
      add: getEthereumForm([
        'name',
      ]),
      edit: getEthereumForm([
        'name',
      ]),
    }
  },
  server: {
    sawtooth: {
      add: getSawtoothForm([
        'name',
      ]),
      edit: getSawtoothForm([
        'name',
      ]),
    },
    ethereum: {
      add: getEthereumForm([
        'name',
      ]),
      edit: getEthereumForm([
        'name',
      ]),
    }
  },
}

module.exports = forms