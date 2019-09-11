const builder = require('./builder')

const validators = {
  url: [
    'matches',
    ['^(?:([a-z0-9+.-]+):\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*\\.?)(?::\\d{2,5})?(?:[/?#]\\S*)?$', 'i'],
    'Must be a valid url - e.g. http://apiserver.com'
  ],
  ca: [
    'matches',
    ['^-----BEGIN CERTIFICATE-----[\s\S]*-----END CERTIFICATE-----$'],
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
    helperText: 'Enter the name of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [],
    },
  },
  apiServer: {
    id: 'desired_state.apiServer',
    title: `API Server`,
    helperText: 'Enter the URL for your API server',
    component: 'text',
    validate: {
      type: 'string',
      methods: [
        validators.url,
      ],
    },
  },
  token: {
    id: 'desired_state.token',
    title: `Access Token`,
    helperText: 'Paste the base64 access token',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: [],
    },
  },
  ca: {
    id: 'desired_state.ca',
    title: `Certificate Authority`,
    helperText: 'Paste the base64 certificate authority',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: [
        validators.ca,
      ],
    },
  },
}

const getLocalForm = (required) => {
  return builder({
    fields,
    schema: [
      'name',
    ],
    required,
  })
}

const getRemoteForm = (required) => {
  return builder({
    fields,
    schema: [
      'name',
      'apiServer',
      'token',
      'ca',
    ],
    required,
  })
}

const forms = {
  validators,
  fields,
  browser: {
    local: {
      add: getLocalForm([
        'name',
      ]),
      edit: getLocalForm([
        'name',
      ]),
    },
    remote: {
      add: getRemoteForm([
        'name',
        'apiServer',
        'token',
        'ca',
      ]),
      edit: getRemoteForm([
        'name',
        'apiServer',
      ]),
    }
  },
  server: {
    local: {
      add: getLocalForm([
        'name',
      ]),
      edit: getLocalForm([]),
    },
    remote: {
      add: getRemoteForm([
        'name',
        'apiServer',
        'token',
        'ca',
      ]),
      edit: getRemoteForm([]),
    },
  },
}

module.exports = forms
