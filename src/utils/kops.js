const fs = require('fs')
const exec = require('child_process').exec
const yaml = require('js-yaml')
const pino = require('pino')({
  name: 'kops',
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

  // inject the current process env into the passed environment because when an env option
  // is given to exec it doesn't inherit by default
  if(options.env) {
    useOptions.env = Object.assign({}, process.env, options.env)
  }

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

  command(`create cluster ${ clusterSettings.name }.${ clusterSettings.domain } \\
    --node-count ${ clusterSettings.node_count } \\
    --zones ${ clusterSettings.node_zones.join(',') } \\
    --node-size ${ clusterSettings.node_size } \\
    --master-count ${ clusterSettings.master_count } \\
    --master-size ${ clusterSettings.master_size } \\
    --master-zones ${ clusterSettings.master_zones.join(',') } \\
    --networking ${ settings.kopsNetworking } \\
    --state s3://clusters.${ clusterSettings.domain } \\
    --topology ${ clusterSettings.topology } ${ clusterSettings.topology == 'private' ? '--bastion=true' : '' } \\
    --ssh-public-key ${ publicKeyFilePath } \\
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

  command(`delete cluster ${ params.name }.${ params.domain } \\
    --state s3://clusters.${ params.domain } \\
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

  command(`create secret --name ${ params.name }.${ params.domain } \\
    --state s3://clusters.${ params.domain } \\
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

  command(`update cluster ${ params.name }.${ params.domain } \\
    --state s3://clusters.${ params.domain } \\
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

  command(`validate cluster ${ params.name }.${ params.domain } \\
    --state s3://clusters.${ params.domain }
`, done)
}

/*

  export a kubeconfig for the given cluster

  this will also extract the ca, key and cert from the config
  so we can use those files to access services via the api server proxy

  params:

   * name
   * domain
   * kubeConfigPath

*/
const exportKubeConfig = (params, done) => {
  if(!params.name) return done(`name param required for kops.exportKubeConfig`)
  if(!params.domain) return done(`domain param required for kops.exportKubeConfig`)
  if(!params.kubeConfigPath) return done(`kubeConfigPath param required for kops.exportKubeConfig`)

  const clusterName = `${ params.name }.${ params.domain }`

  async.series([
    next => {
      command(`export kubecfg ${ params.name }.${ params.domain } \\
    --state s3://clusters.${ params.domain }
`, 
      {
        env: {
          KUBECONFIG: params.kubeConfigPath,
        }
      },
      next)
    },

    // extract the ca, key and cert from the kubeconfig file
    next => {
      
      async.waterfall([
        (nextw) => fs.readFile(params.kubeConfigPath, 'utf8', next),

        (kubeconfig, nextw) => {
          let parsedKubeconfig = null
          try {
            parsedKubeconfig = yaml.safeLoad(kubeconfig)
          } catch (e) {
            return nextw(e.toString())
          }

          const cluster = parsedKubeconfig.clusters.filter(cluster => cluster.name == clusterName)[0]
          const user = parsedKubeconfig.users.filter(user => user.name == clusterName)[0]

          if(!cluster) return nextw(`no cluster in kubeconfig found for ${ clusterName } `)
          if(!user) return nextw(`no user in kubeconfig found for ${ clusterName } `)

          async.parallel([

            // write the ca.pem
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'ca.pem',
                data: Buffer.from(cluster['certificate-authority-data'], 'base64').toString(),
              }, nextp)
            },

            // write the admin-key.pem
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'admin-key.pem',
                data: Buffer.from(user['client-key-data'], 'base64').toString(),
              }, nextp)
            },

            // write the admin.pem
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'admin.pem',
                data: Buffer.from(user['client-certificate-data'], 'base64').toString(),
              }, nextp)
            },

            // write the username
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'username',
                data: user.username,
              }, nextp)
            },

            // write the password
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'password',
                data: user.password,
              }, nextp)
            },

          ], nextw)
        }
      ], next)
    },

  ], done)
  
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

  command(`toolbox dump --name ${ params.name }.${ params.domain } \\
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