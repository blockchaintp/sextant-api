const Joi = require('joi')
const yaml = require('js-yaml')

const templateUtils = require('./utils')

/*

  validate the given settings payload for a deployment

  {
    network_name: 'sawtooth',
    poet_enabled: 'false',
    rbac_enabled: 'true',
    rbac_secret_key: 'g7op0ioXPdw7jFTf4aY2',
    rbac_aes_key: '37960e8f0337b90131acfb30b8817d17',
    rbac_batcher_key: 'a8fbe6bb38fb6ae5cc1abbfee9068f734b4c023cc5ffc193a8c9d83793d0ee02',
    xo_enabled: 'true',
    smallbank_enabled: 'true',
    simple_enabled: 'true',
  }
  
*/
const schema = Joi.object().keys({

  network_name: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
  genesis_enabled: Joi.boolean().required(),
  poet_enabled: Joi.boolean().required(),
  rbac_enabled: Joi.boolean().required(),
  //rbac_secret_key: Joi.string().regex(/^[a-zA-Z0-9]{20}$/).required(),
  //rbac_aes_key: Joi.string().regex(/^[0-9a-fA-F]{32}$/).required(),
  //rbac_batcher_key: Joi.string().regex(/^[0-9a-fA-F]{64}$/).required(),
  xo_enabled: Joi.boolean().required(),
  smallbank_enabled: Joi.boolean().required(),
  simple_enabled: Joi.boolean().required(),
  dynamic_peering: Joi.boolean().required(),
  external_seeds: Joi.array().items(Joi.string().regex(/^[\w\.]+:\d+$/)).required(),
  custom_tps: Joi.array().required(),
})

const validateSettings = (settings) => Joi.validate(settings, schema).error

// the frontend wants strings as 'true' or 'false' for the Radio components
// turn them into actual booleans
const processStringBoolean = (value) => value == 'true' ? true : false
const processSettings = (settings) => {
  return Object.assign({}, settings, {
    poet_enabled: processStringBoolean(settings.poet_enabled),
    genesis_enabled: processStringBoolean(settings.genesis_enabled),
    rbac_enabled: processStringBoolean(settings.rbac_enabled),
    xo_enabled: processStringBoolean(settings.xo_enabled),
    smallbank_enabled: processStringBoolean(settings.smallbank_enabled),
    simple_enabled: processStringBoolean(settings.simple_enabled),
    dynamic_peering: processStringBoolean(settings.dynamic_peering),
  })
}

// load the default kops values from sawtooth/defaults.yaml
const getDefaults = () => templateUtils.getTemplateYaml('sawtooth/defaults.yaml')

// turn the base settings.json into a kops values.yaml structure ready
// for kubetpl
// first load the default values and then populate it with the cluster and deployment settings
const getValues = (clusterSettings, deploymentSettings) => {

  // first load the default yaml into a new object
  const finalSettings = getDefaults()

  const {
    cloud,
    storage,
    sawtooth,
    dns,
    sources,
  } = finalSettings

  // general sawtooth settings
  sawtooth.networkName = deploymentSettings.network_name
  sawtooth.replicas = clusterSettings.node_count
  sawtooth.dynamicPeering = deploymentSettings.dynamic_peering
  sawtooth.genesis.enabled = deploymentSettings.genesis_enabled
  sawtooth.externalSeeds = deploymentSettings.external_seeds

  // sawtooth poet settings
  sawtooth.poet.enabled = deploymentSettings.poet_enabled

  // sawtrooth rbac settings
  sawtooth.rbac.enabled = deploymentSettings.rbac_enabled
  //sawtooth.rbac.secretKey = deploymentSettings.rbac_secret_key
  //sawtooth.rbac.aesKey = deploymentSettings.rbac_aes_key
  //sawtooth.rbac.batcherKey = deploymentSettings.rbac_batcher_key

  // sawtooth xo settings
  sawtooth.xo.enabled = deploymentSettings.xo_enabled

  // sawtooth smallbank settings
  sawtooth.smallbank.enabled = deploymentSettings.smallbank_enabled

  // sawtooth simple settings
  sawtooth.simple.enabled = deploymentSettings.simple_enabled

  // loop over the user submitted custom tps and populate the customTPs array
  sawtooth.customTPs = deploymentSettings.custom_tps

  // dns settings
  dns.domain = [clusterSettings.name, clusterSettings.domain].join('.')

  return finalSettings
}

// get a string that is the values.yaml ready for kubetpl
const getYaml = (clusterSettings, deploymentSettings) => {
  const jsonValues = getValues(clusterSettings, deploymentSettings)
  return yaml.safeDump(jsonValues)
}

module.exports = {
  validateSettings,
  processSettings,
  getDefaults,
  getValues,
  getYaml,
}
