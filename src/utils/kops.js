const fs = require('fs')
const exec = require('child_process').exec
const yaml = require('js-yaml')
const async = require('async')
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

  create the kops cluster using a pre-created kops.yaml file

  /*

  params:

   * domain
   * yamlPath

*/
const createCluster = (params, done) => {

  if(!params.domain) return done(`domain param required for kops.createCluster`)
  if(!params.yamlPath) return done(`yamlPath param required for kops.createCluster`)

  const { domain, yamlPath } = params

  command(`create \\
    --state s3://clusters.${ domain } \\
    -f ${ yamlPath }
`, done)
}

/*

  does a cluster exist as far as kops knows?

  params:

   * name
   * domain
  
*/
const clusterExists = (params, done) => {

  if(!params.name) return done(`name param required for kops.clusterExists`)
  if(!params.domain) return done(`domain param required for kops.clusterExists`)

  const { name, domain } = params

  command(`get clusters --state s3://clusters.${ domain }`, (err, results) => {
    if(err) return done(err)
    const exists = results.indexOf(`${ name }.${ domain }`) >= 0
    done(null, exists)
  })
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

  const { name, domain } = params

  command(`delete cluster ${ name }.${ domain } \\
    --state s3://clusters.${ domain } \\
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

  const { name, domain, publicKeyFilePath } = params

  command(`create secret --name ${ name }.${ domain } \\
    --state s3://clusters.${ domain } \\
    sshpublickey admin -i ${ publicKeyFilePath }
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

  const { name, domain } = params

  command(`update cluster ${ name }.${ domain } \\
    --state s3://clusters.${ domain } \\
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

  const { name, domain } = params

  command(`validate cluster ${ name }.${ domain } \\
    --state s3://clusters.${ domain }
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

  const { name, domain, kubeConfigPath } = params

  command(`export kubecfg ${ name }.${ domain } \\
    --state s3://clusters.${ domain }
`, 
  {
    env: {
      KUBECONFIG: kubeConfigPath,
    }
  },
  done)  
}

/*

  process the kubeconfig and extra the ca, cert, key, username and password

  params:

   * name 
   * domain
   * kubeConfigPath
  
*/
const extractKubeConfigAuthDetails = (params, done) => {
  if(!params.name) return done(`name param required for kops.exportKubeConfig`)
  if(!params.domain) return done(`domain param required for kops.exportKubeConfig`)
  if(!params.kubeConfigPath) return done(`kubeConfigPath param required for kops.exportKubeConfig`)

  const { name, domain, kubeConfigPath } = params

  const clusterName = `${ name }.${ domain }`

  async.waterfall([
    (next) => fs.readFile(kubeConfigPath, 'utf8', next),

    (kubeconfig, next) => {
      let parsedKubeconfig = null
      try {
        parsedKubeconfig = yaml.safeLoad(kubeconfig)
      } catch (e) {
        return next(e.toString())
      }

      const cluster = parsedKubeconfig.clusters.filter(cluster => cluster.name == clusterName)[0]
      const user = parsedKubeconfig.users.filter(user => user.name == clusterName)[0]

      if(!cluster) return next(`no cluster in kubeconfig found for ${ clusterName } `)
      if(!user) return next(`no user in kubeconfig found for ${ clusterName } `)

      const authDetails = {
        ca: Buffer.from(cluster.cluster['certificate-authority-data'], 'base64').toString(),
        key: Buffer.from(user.user['client-key-data'], 'base64').toString(),
        cert: Buffer.from(user.user['client-certificate-data'], 'base64').toString(),
        username: user.user.username,
        password: user.user.password,
      }

      next(null, authDetails)
    }
  ], done)
}

module.exports = {
  command,
  createCluster,
  clusterExists,
  destroyCluster,
  createSecret,
  updateCluster,
  validateCluster,
  exportKubeConfig,
  extractKubeConfigAuthDetails,
}