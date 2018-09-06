const fs = require('fs')
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const pino = require('pino')({
  name: 'kubectl',
})

const settings = require('../settings')

const command = (cmd, options, done) => {

  if(!done) {
    done = options
    options = {}
  }

  const useOptions = Object.assign({}, options, {
    // allow 5MB back on stdout 
    //(which should not happen but some logs might be longer than 200kb which is the default)
    maxBuffer: 1024 * 1024 * 5,
  })

  const runCommand = `kops ${cmd}`

  pino.info({
    action: 'command',
    command: runCommand,
    options: useOptions,
  })

  exec(runCommand, useOptions, (err, stdout, stderr) => {
    if(err) return done(err)
    done(null, stdout.toString(), stderr.toString())
  })
}

/*

  create the kops cluster using the cluster settings.json

  /*

  params:

   * clusterSettings
   * publicKeyFilePath

  clusterSettings:

  {
    domain: "dev.catenasys.com.",
    master_count: 1,
    master_size: "m4.large",
    master_zones: ["eu-west-2a"],
    name: "apples",
    node_count: 3,
    node_size: "m4.large",
    node_zones: ["eu-west-2a"],
    region: "eu-west-2",
    topology: "public",
    public_key: "XXX",
  }

*/
const createCluster = (params, done) => {

  if(!params.clusterSettings) return done(`clusterSettings param required for kops.createCluster`)
  if(!params.publicKeyFilePath) return done(`publicKeyFilePath param required for kops.createCluster`)

  const { clusterSettings, publicKeyFilePath } = params

  command(`create cluster ${ clusterSettings.name }.${ clusterSettings.domain } \
    --node-count ${ clusterSettings.node_count } \
    --zones ${ clusterSettings.node_zones.join(',') } \
    --node-size ${ clusterSettings.node_size } \
    --master-count ${ clusterSettings.master_count } \
    --master-size ${ clusterSettings.master_size } \
    --master-zones ${ clusterSettings.master_zones.join(',') } \
    --networking ${ settings.kopsNetworking } \
    --state s3://clusters.${ clusterSettings.domain } \
    --topology ${ clusterSettings.topology } ${ clusterSettings.topology == 'private' ? '--bastion=true' : '' } \
    --ssh-public-key ${ publicKeyFilePath } \
    --yes
`, done)
}

/*

  destroy a kops cluster

  params:

   * name
   * domain
  
*/
const destroyCluster = (params, done) => {

  if(!params.name) return done(`name param required for kops.destroyCluster`)
  if(!params.domain) return done(`domain param required for kops.destroyCluster`)

  command(`delete cluster ${ params.name }.${ params.domain } \
    --state s3://clusters.${ params.domain } \
    --yes
`, done)
}

/*

  params:

   * name
   * domain
   * keyFilePath
  
*/
const createSecret = (params, done) => {
  if(!params.name) return done(`name param required for kops.createSecret`)
  if(!params.domain) return done(`domain param required for kops.createSecret`)
  if(!params.publicKeyFilePath) return done(`keyFilePath param required for kops.createSecret`)

  command(`create secret --name ${ params.name }.${ params.domain } \
    --state s3://clusters.${ params.domain } \
    sshpublickey admin -i ${ params.publicKeyFilePath }
`, done)
}

/*

  params:

   * name
   * domain
  
*/
const updateCluster = (params, done) => {
  if(!params.name) return done(`name param required for kops.updateCluster`)
  if(!params.domain) return done(`domain param required for kops.updateCluster`)

  command(`update cluster ${ params.name }.${ params.domain } \
    --state s3://clusters.${ params.domain } \
    --yes
`, done)
}

/*

  params:

   * name
   * domain
  
*/
const validateCluster = (params, done) => {
  if(!params.name) return done(`name param required for kops.validateCluster`)
  if(!params.domain) return done(`domain param required for kops.validateCluster`)

  command(`validate cluster ${ params.name }.${ params.domain } \
    --state s3://clusters.${ params.domain }
`, done)
}

/*

  params:

   * name
   * domain
   * kubeConfigPath
  
*/
const exportKubeConfig = (params, done) => {
  if(!params.name) return done(`name param required for kops.exportKubeConfig`)
  if(!params.domain) return done(`domain param required for kops.exportKubeConfig`)
  if(!params.kubeConfigPath) return done(`kubeConfigPath param required for kops.exportKubeConfig`)

  command(`export kubecfg ${ params.name }.${ params.domain } \
    --state s3://clusters.${ params.domain }
`, 
  {
    env: {
      KUBECONFIG: params.kubeConfigPath,
    }
  },
  done)
}

/*

  params:

   * name
   * domain
   * kopsConfigPath
  
*/
const exportKopsConfig = (params, done) => {
  if(!params.name) return done(`name param required for kops.exportKopsConfig`)
  if(!params.domain) return done(`domain param required for kops.exportKopsConfig`)
  if(!params.kopsConfigPath) return done(`kopsConfigPath param required for kops.exportKopsConfig`)

  command(`export kubecfg ${ params.name }.${ params.domain } \
    --state s3://clusters.${ params.domain }
`, (err, stdout) => {
    if(err) return done(err)
    fs.writeFile(params.kopsConfigPath, stdout.toString(), 'utf8', done)
  })
}

module.exports = {
  command,
  createCluster,
  destroyCluster,
  createSecret,
  updateCluster,
  validateCluster,
  exportKubeConfig,
  exportKopsConfig,
}