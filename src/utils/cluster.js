const Joi = require('joi')

/*

  validate the given settings payload for a cluster

  {
    domain: "dev.catenasys.com.",
    master_size: 1,
    master_type: "m1.medium",
    master_zones: ["eu-west-2a"],
    name: "apples",
    node_size: 3,
    node_type: "m1.medium",
    node_zones: ["eu-west-2a"],
    region: "eu-west-2",
    topology: "public",
    public_key: "XXX",
  }

*/
const clusterSettingsSchema = Joi.object().keys({

  name: Joi.string().regex(/^[a-zA-Z0-9\.-]+$/).required(),
  domain: Joi.string().regex(/^[a-zA-Z0-9\.-]+$/).required(),

  region: Joi.string().regex(/^\w+-\w+-\d+$/).required(),
  topology: Joi.string().valid(['public', 'private']).required(),
  public_key: Joi.string().regex(/^ssh-rsa AAAA/).required(),
  
  master_count: Joi.number().integer().valid([1,3,5]).required(),
  master_size: Joi.string().regex(/^\w+\.\w+$/).required(),
  master_zones: Joi.array().items(Joi.string().regex(/^\w+-\w+-\d+\w+$/)).required(),
  
  node_count: Joi.number().integer().min(2).max(128).required(),
  node_size: Joi.string().regex(/^\w+\.\w+$/).required(),
  node_zones: Joi.array().items(Joi.string().regex(/^\w+-\w+-\d+\w+$/)).required(),

})

const validateClusterSettings = (settings) => Joi.validate(settings, clusterSettingsSchema).error

const processClusterSettings = (settings) => {
  const newSettings = Object.assign({}, settings)
  newSettings.domain = newSettings.domain.replace(/\.$/, '')
  return newSettings
}

module.exports = {
  validateClusterSettings,
  processClusterSettings,
}