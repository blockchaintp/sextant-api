const Joi = require('joi')
const yaml = require('js-yaml')
const { cidr } = require('node-cidr')

const templateUtils = require('./utils')

/*

  validate the given settings payload for a kubeconnect

  {
    kubapi_address: "api.foo.dev.catenasys.com",
    name: "foo",
  }

*/
const schema = Joi.object().keys({

  name: Joi.string().regex(/^[a-zA-Z0-9\.-]+$/).required(),
  kubeapi_address: Joi.string().regex(/^[a-zA-Z0-9\.-]+$/).required(),

})

const validateSettings = (settings) => Joi.validate(settings, schema).error

const processSettings = (settings) => {
  const newSettings = Object.assign({}, settings)
  newSettings.kubeapi_address = newSettings.kubeapi_address.replace(/\.$/, '')
  return newSettings
}



// load the default kops values from kops/defaults.yaml
const getDefaults = () => templateUtils.getTemplateYaml('kubeconnect/defaults.yaml')

// turn the base settings.json into a kops values.yaml structure ready
// for kubetpl
// first load the default values and then populate it with the cluster settings
const getValues = (settings) => {

  // first load the default yaml into a new object
  const finalSettings = getDefaults()

  const {
    cluster,
  } = finalSettings

  // cluster settings
  cluster.name = settings.name
  cluster.kubeapi_address = settings.kubeapi_address

  return finalSettings
}

// get a string that is the values.yaml ready for kubetpl
const getYaml = (settings, bucket) => yaml.safeDump(getValues(settings, bucket))

module.exports = {
  validateSettings,
  processSettings,
  getDefaults,
  getValues,
  getYaml,
}