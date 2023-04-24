/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable max-len */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const builder = require('./builder')

const validators = {
  min: (num) => ['min', num, `Must be at least ${num} characters`],
  max: (num) => ['max', num, `Must be at most ${num} characters`],
  noSpaces: ['matches', '^\\S+$', 'Cannot contain spaces'],
  reserved: ['matches', '^(?!default$|all$|local$|cluster$).*', 'Cannot be reserved word'],
  specialCharacters: ['matches', '^[a-zA-Z0-9-]*$', 'Cannot contain special characters'],
  url: [
    'matches',
    [
      // eslint-disable-next-line max-len
      '^(?:([a-z0-9+.-]+):\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*\\.?)(?::\\d{2,5})?(?:[/?#]\\S*)?$(?!([^/]))',
      'i',
    ],
    'Must be a valid url with no trailing slash - e.g. http://apiserver.com',
  ],
  ca: [
    'matches',
    ['^-----BEGIN CERTIFICATE-----[\\s\\S]*-----END CERTIFICATE-----$'],
    {
      message: 'Must be a valid certificate',
      excludeEmptyString: true,
    },
  ],
}

const fields = {
  name: {
    id: 'name',
    title: 'Name',
    helperText: 'Enter the name of the cluster',
    component: 'text',
    validate: {
      type: 'string',
      methods: [validators.min(3), validators.max(30), validators.noSpaces, validators.reserved],
    },
  },
  apiServer: {
    id: 'desired_state.apiServer',
    title: 'API Server',
    helperText: 'Enter the URL for your API server',
    component: 'text',
    validate: {
      type: 'string',
      methods: [validators.url],
    },
  },
  token: {
    id: 'desired_state.token',
    title: 'Access Token',
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
    title: 'Certificate Authority',
    helperText: 'Paste the base64 certificate authority',
    component: 'textarea',
    rows: 5,
    validate: {
      type: 'string',
      methods: [validators.ca],
    },
  },
}

const getLocalForm = (required) =>
  builder({
    fields,
    schema: ['name'],
    required,
  })

const getRemoteForm = (required) =>
  builder({
    fields,
    schema: ['name', 'apiServer', 'token', 'ca'],
    required,
  })

const forms = {
  validators,
  fields,
  browser: {
    local: {
      add: getLocalForm(['name']),
      edit: getLocalForm(['name']),
    },
    remote: {
      add: getRemoteForm(['name', 'apiServer', 'token', 'ca']),
      edit: getRemoteForm(['name', 'apiServer']),
    },
  },
  server: {
    local: {
      add: getLocalForm(['name']),
      edit: getLocalForm([]),
    },
    remote: {
      add: getRemoteForm(['name', 'apiServer', 'token', 'ca']),
      edit: getRemoteForm([]),
    },
  },
}

export default forms
