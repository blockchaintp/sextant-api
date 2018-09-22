const Joi = require('joi')
const yaml = require('js-yaml')
const { cidr } = require('node-cidr')

const Kubectl = require('./kubectl')

const DEFAULT_MAX_PRICE = 0.314

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

  network_cidr: Joi.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{2}$/).required(),

})

const validateClusterSettings = (settings) => Joi.validate(settings, clusterSettingsSchema).error

const processClusterSettings = (settings) => {
  const newSettings = Object.assign({}, settings)
  newSettings.domain = newSettings.domain.replace(/\.$/, '')
  return newSettings
}

// return a kubectl instance that is bound to a certain cluster via it's
// kubeconfig file
const getKubectl = (store, clustername, done) => {
  store.getClusterFilePath({
    clustername,
    filename: 'kubeConfig',
  }, (err, kubeconfigPath) => {
    if(err) return done(err)
    const kubectl = Kubectl(kubeconfigPath)
    done(null, kubectl)
  })
}

// distribute the number of instances across the given zones equally
const getInstanceCountZones = (zones, instanceCount, maxPrice) => {
  const perZone = Math.floor(instanceCount / zones.length)
  const remainer = instanceCount % zones.length
  return zones.map((zone, i) => {
    const zoneInstanceCount = perZone + (i+1 <= remainer ? 1 : 0)
    const ret = {
      subnet: zone,
      minSize: zoneInstanceCount,
      maxSize: zoneInstanceCount,
    }
    /*

      we need the YAML output to be:
      maxPrice: | 
        "0.314"
      
    */
    if(maxPrice) {
      ret.maxPrice = `"\n\"${maxPrice}\""`
    }
    return ret
  })
}

const mergeZones = (masterZones, nodeZones) => {
  const allZones = masterZones.concat(nodeZones)
  return allZones.reduce((all, zone) => {
    if(all.indexOf(zone) < 0) all.push(zone)
    return all
  }, [])
}

const getSubnets = (zones, network_cidr, subnet_mask) => {
  const subnets = cidr.subnets(network_cidr, subnet_mask)
  return zones.map((zone, i) => ({
    name: zone,
    cidr: subnets[i],
  }))
}

// turn the base settings.json into a kops values.yaml structure ready
// for kubetpl
const getKopsValues = (settings) => {
  return {
    kops: {
      stateStore: `s3://clusters.${ settings.domain }`,
    },
    cloud: {
      provider: 'aws',
    },
    cluster: {
      name: settings.name,
      domainName: settings.domain,
      master: {
        machineType: settings.master_size,
        zones: getInstanceCountZones(settings.master_zones, settings.master_count),

      },
      node: {
        machineType: settings.node_size,
        zones: getInstanceCountZones(settings.node_zones, settings.node_count),
      }
    },
    topology: {
      dns: {
        type: 'Public',
      },
      masters: 'public',
      nodes: 'public',
    },
    networkCIDR: settings.node_size,
    subnets: getSubnets(mergeZones(settings.master_zones, settings.node_zones), settings.network_cidr, settings.subnet_mask),
  }
}

// get a string that is the values.yaml ready for kubetpl
const getKopsYaml = (settings) => yaml.safeDump(getKopsValues(settings))

module.exports = {
  validateClusterSettings,
  processClusterSettings,
  getKubectl,
  getKopsValues,
  getKopsYaml,
}