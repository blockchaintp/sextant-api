const Joi = require('joi')
const yaml = require('js-yaml')
const { cidr } = require('node-cidr')

const templateUtils = require('./utils')

/*

  validate the given settings payload for a cluster

  {
    domain: "dev.catenasys.com",
    master_count: 1,
    master_size: "m4.large",
    master_zones: ["eu-west-2a"],
    name: "apples",
    node_count: 3,
    node_size: "m4.large",
    node_zones: ["eu-west-2a"],
    region: "eu-west-2",
    topology: "public",
    network_cidr: "172.20.0.0/16",
    subnet_mask: 19,
    public_key: "XXX"
  }

*/
const schema = Joi.object().keys({

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

  network_cidr: Joi.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{2}$/).required(),
  subnet_mask: Joi.number().integer().min(1).max(32).required(),

})

const validateSettings = (settings) => Joi.validate(settings, schema).error

const processSettings = (settings) => {
  const newSettings = Object.assign({}, settings)
  newSettings.domain = newSettings.domain.replace(/\.$/, '')
  return newSettings
}

// distribute the number of instances across the given zones equally
const getInstanceCountZones = (zones, instanceCount, defaultZone) => {
  const perZone = Math.floor(instanceCount / zones.length)
  const remainer = instanceCount % zones.length
  return zones.map((zone, i) => {
    const zoneInstanceCount = perZone + (i+1 <= remainer ? 1 : 0)

    // start of using the defaultZone from the yaml defaults
    // make sure it's a new object even if it has deep values
    const newZone = JSON.parse(JSON.stringify(defaultZone))

    newZone.subnet = zone
    newZone.minSize = zoneInstanceCount
    newZone.maxSize = zoneInstanceCount

    return newZone
  })
}

// return a unique list of zone names by merging the master and node zones
const mergeZones = (masterZones, nodeZones) => {
  const allZones = masterZones.concat(nodeZones)
  return allZones.reduce((all, zone) => {
    if(all.indexOf(zone) < 0) all.push(zone)
    return all
  }, [])
}

// return a list of subnets based on the given zones
const getSubnets = (zones, network_cidr, subnet_mask) => {
  const subnets = cidr.subnets(network_cidr, subnet_mask)
  return zones.map((zone, i) => ({
    name: zone,
    cidr: subnets[i],
  }))
}

// load the default kops values from kops/defaults.yaml
const getDefaults = () => templateUtils.getTemplateYaml('kops/defaults.yaml')

// turn the base settings.json into a kops values.yaml structure ready
// for kubetpl
// first load the default values and then populate it with the cluster settings
const getValues = (settings) => {

  // first load the default yaml into a new object
  const finalSettings = getDefaults()

  const {
    kops,
    cluster,
  } = finalSettings

  // statestore
  kops.stateStore = `s3://clusters.${ settings.domain }`

  // cluster settings
  cluster.name = settings.name
  cluster.domainName = settings.domain

  // cluster -> master settings
  cluster.master.machineType = settings.master_size

  // cluster -> master zones
  // create the master zones using the default zone as base values
  // NOTE: the default zone is always the first zone found in kops/defaults.yaml
  const defaultMasterZone = cluster.node.zones[0] || {}
  cluster.master.zones = getInstanceCountZones(settings.master_zones, settings.master_count, defaultMasterZone)

  // cluster -> node settings
  cluster.node.machineType = settings.node_size

  // cluster -> node zones
  // create the node zones using the default zone as base values
  // NOTE: the default zone is always the first zone found in kops/defaults.yaml
  const defaultNodeZone = cluster.node.zones[0] || {}
  cluster.node.zones = getInstanceCountZones(settings.node_zones, settings.node_count, defaultNodeZone)

  // cluster -> network settings
  cluster.networkCIDR = settings.network_cidr

  // create the network CIDR ranges by looping over all the zones
  cluster.subnets = getSubnets(mergeZones(settings.master_zones, settings.node_zones), settings.network_cidr, settings.subnet_mask)

  return finalSettings
}

// get a string that is the values.yaml ready for kubetpl
const getYaml = (settings) => yaml.safeDump(getValues(settings))

module.exports = {
  validateSettings,
  processSettings,
  getDefaults,
  getValues,
  getYaml,
}