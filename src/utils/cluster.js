const Joi = require('joi')
const yaml = require('js-yaml')
const { cidr } = require('node-cidr')

const Kubectl = require('./kubectl')

// cluster defaults
const DEFAULT_MAX_PRICE = 0.314

// deployment defaults

// cloud.storage
const DEFAULT_CLOUD_STORAGE_PROVISIONER = 'kubernetes.io/aws-ebs'
const DEFAULT_CLOUD_STORAGE_FAST_TYPE = 'io1'
const DEFAULT_CLOUD_STORAGE_SLOW_TYPE = 'gp2'

// storage
const DEFAULT_STORAGE_RECLAIM_POLICY = 'Delete'
const DEFAULT_STORAGE_IOPS = '50'
const DEFAULT_STORAGE_FSTYPE = 'ext4'

// sawtooth
const DEFAULT_SAWTOOTH_SCHEDULER = 'parallel'

// sawtooth.poet
const DEFAULT_POET_TARGET_WAIT_TIME = 30
const DEFAULT_POET_INITIAL_WAIT_TIME = 25
const DEFAULT_POET_MAX_BATCHES_PER_BLOCK = 100
const DEFAULT_POET_ENCLAVE_MODULE = 'simulator'

// sources
const DEFAULT_IMAGE_REPO = 'blockchaintp'
const DEFAULT_VERSION = '1.0.5'
const DEFAULT_RBAC_VERSION = 'develop'
const DEFAULT_SIMPLE_VERSION = 'latest'

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
  subnet_mask: Joi.number().integer().min(1).max(32).required(),

})


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
const deploymentSettingsSchema = Joi.object().keys({

  network_name: Joi.string().regex(/^[a-zA-Z0-9]+$/).required(),
  poet_enabled: Joi.boolean().required(),
  rbac_enabled: Joi.boolean().required(),
  rbac_secret_key: Joi.string().regex(/^[a-zA-Z0-9]{20}$/).required(),
  rbac_aes_key: Joi.string().regex(/^[0-9a-fA-F]{32}$/).required(),
  rbac_batcher_key: Joi.string().regex(/^[0-9a-fA-F]{64}$/).required(),
  xo_enabled: Joi.boolean().required(),
  smallbank_enabled: Joi.boolean().required(),
  simple_enabled: Joi.boolean().required(),

})

const validateClusterSettings = (settings) => Joi.validate(settings, clusterSettingsSchema).error
const validateDeploymentSettings = (settings) => Joi.validate(settings, deploymentSettingsSchema).error

const processClusterSettings = (settings) => {
  const newSettings = Object.assign({}, settings)
  newSettings.domain = newSettings.domain.replace(/\.$/, '')
  return newSettings
}

// the frontend wants strings as 'true' or 'false' for the Radio components
// turn them into actual booleans
const processStringBoolean = (value) => value == 'true' ? true : false
const processDeploymentSettings = (settings) => {
  return Object.assign({}, settings, {
    poet_enabled: processStringBoolean(settings.poet_enabled),
    rbac_enabled: processStringBoolean(settings.rbac_enabled),
    xo_enabled: processStringBoolean(settings.xo_enabled),
    smallbank_enabled: processStringBoolean(settings.smallbank_enabled),
    simple_enabled: processStringBoolean(settings.simple_enabled),
  })
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
      ret.maxPrice = `"${maxPrice}"\n`
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
        zones: getInstanceCountZones(settings.master_zones, settings.master_count/*, DEFAULT_MAX_PRICE*/),

      },
      node: {
        machineType: settings.node_size,
        zones: getInstanceCountZones(settings.node_zones, settings.node_count/*, DEFAULT_MAX_PRICE*/),
      },
      topology: {
        dns: {
          type: 'Public',
        },
        masters: 'public',
        nodes: 'public',
      },
      networkCIDR: settings.network_cidr,
      subnets: getSubnets(mergeZones(settings.master_zones, settings.node_zones), settings.network_cidr, settings.subnet_mask),
    },
  }
}

// get a string that is the values.yaml ready for kubetpl
const getKopsYaml = (settings) => yaml.safeDump(getKopsValues(settings))

// turn the base settings.json into a kops values.yaml structure ready
// for kubetpl
const getDeploymentValues = (clusterSettings, deploymentSettings) => {
  return {
    cloud: {
      storage: {
        provisioner: DEFAULT_CLOUD_STORAGE_PROVISIONER,
        fastType: DEFAULT_CLOUD_STORAGE_FAST_TYPE,
        slowType: DEFAULT_CLOUD_STORAGE_SLOW_TYPE,
      },
    },
    storage: {
      reclaimPolicy: DEFAULT_STORAGE_RECLAIM_POLICY,
      iops: DEFAULT_STORAGE_IOPS,
      fsType: DEFAULT_STORAGE_FSTYPE,
    },
    sawtooth: {
      networkName: deploymentSettings.network_name,
      replicas: clusterSettings.node_count,
      scheduler: DEFAULT_SAWTOOTH_SCHEDULER,
      poet: {
        enabled: deploymentSettings.poet_enabled,
        targetWaitTime: DEFAULT_POET_TARGET_WAIT_TIME,
        initialWaitTime: DEFAULT_POET_INITIAL_WAIT_TIME,
        maxBatchesPerBlock: DEFAULT_POET_MAX_BATCHES_PER_BLOCK,
        enclaveModule: DEFAULT_POET_ENCLAVE_MODULE,
      },
      genesis: {
        enabled: true,
      },
      rbac: {
        enabled: deploymentSettings.rbac_enabled,
        secretKey: deploymentSettings.rbac_secret_key,
        aesKey: deploymentSettings.rbac_aes_key,
        batcherKey: deploymentSettings.rbac_batcher_key,
      },
      xo: {
        enabled: deploymentSettings.xo_enabled,
      },
      smallbank: {
        enabled: deploymentSettings.smallbank_enabled,
      },
      simple: {
        enabled: deploymentSettings.simple_enabled,
      },
    },
    dns: {
      domain: [clusterSettings.name, clusterSettings.domain].join('.'),
    },
    sources: {
      imageRepository: DEFAULT_IMAGE_REPO,
      version: DEFAULT_VERSION,
      rbacVersion: DEFAULT_RBAC_VERSION,
      simpleVersion: DEFAULT_SIMPLE_VERSION,
    }
  }
}

// get a string that is the values.yaml ready for kubetpl
const getDeploymentYaml = (clusterSettings, deploymentSettings) => yaml.safeDump(getDeploymentValues(clusterSettings, deploymentSettings))

module.exports = {
  validateClusterSettings,
  validateDeploymentSettings,
  processClusterSettings,
  processDeploymentSettings,
  getKubectl,
  getKopsValues,
  getKopsYaml,
  getDeploymentValues,
  getDeploymentYaml,
}