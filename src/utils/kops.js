/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
const fs = require('fs')
const { exec } = require('child_process')
const yaml = require('js-yaml')
const async = require('async')
const pino = require('pino')({
  name: 'kops',
})

const command = (cmd, options, done) => {
  if (!done) {
    done = options
    options = {}
  }

  // allow 5MB back on stdout
  // (which should not happen but some logs might be longer than 200kb which is the default)
  const useOptions = { ...options, maxBuffer: 1024 * 1024 * 5 }

  // inject the current process env into the passed environment because when an env option
  // is given to exec it doesn't inherit by default
  if (options.env) {
    useOptions.env = { ...process.env, ...options.env }
  }

  const runCommand = `kops ${cmd}`

  pino.info({
    action: 'command',
    command: runCommand,
    options: useOptions,
  })

  exec(runCommand, useOptions, (err, stdout, stderr) => {
    if (err) return done(err)
    done(null, stdout.toString(), stderr.toString())
  })
}

const getStateStore = (bucket) => `s3://${bucket}/kopsState`

/*

  create the kops cluster using a pre-created kops.yaml file

  /*

  params:

   * bucket
   * yamlPath

*/
const createCluster = (params, done) => {
  if (!params.bucket) return done('bucket param required for kops.createCluster')
  if (!params.yamlPath) return done('yamlPath param required for kops.createCluster')

  const { bucket, yamlPath } = params

  command(`create \\
    --state ${getStateStore(bucket)} \\
    -f ${yamlPath}
`, done)
}

/*

  does a cluster exist as far as kops knows?

  params:

   * name
   * domain
   * bucket

*/
const clusterExists = (params, done) => {
  if (!params.name) return done('name param required for kops.clusterExists')
  if (!params.domain) return done('domain param required for kops.clusterExists')
  if (!params.bucket) return done('bucket param required for kops.clusterExists')

  const { name, domain, bucket } = params

  command(`get clusters --state ${getStateStore(bucket)}`, (err, results) => {
    if (err) return done(null, false)
    const exists = results.indexOf(`${name}.${domain}`) >= 0
    done(null, exists)
  })
}

/*

  destroy a kops cluster

  params:

   * name
   * domain
   * bucket

*/
const destroyCluster = (params, done) => {
  if (!params.name) return done('name param required for kops.destroyCluster')
  if (!params.domain) return done('domain param required for kops.destroyCluster')
  if (!params.bucket) return done('bucket param required for kops.destroyCluster')

  const { name, domain, bucket } = params

  command(`delete cluster ${name}.${domain} \\
    --state ${getStateStore(bucket)} \\
    --yes
`, done)
}

/*

  params:

   * name
   * domain
   * keyFilePath
   * bucket

*/
const createSecret = (params, done) => {
  if (!params.name) return done('name param required for kops.createSecret')
  if (!params.domain) return done('domain param required for kops.createSecret')
  if (!params.publicKeyFilePath) return done('keyFilePath param required for kops.createSecret')
  if (!params.bucket) return done('bucket param required for kops.createSecret')

  const {
    name, domain, publicKeyFilePath, bucket,
  } = params

  command(`create secret --name ${name}.${domain} \\
    --state ${getStateStore(bucket)} \\
    sshpublickey admin -i ${publicKeyFilePath}
`, done)
}

/*

  params:

   * name
   * domain
   * bucket

*/
const updateCluster = (params, done) => {
  if (!params.name) return done('name param required for kops.updateCluster')
  if (!params.domain) return done('domain param required for kops.updateCluster')
  if (!params.bucket) return done('bucket param required for kops.updateCluster')

  const { name, domain, bucket } = params

  command(`update cluster ${name}.${domain} \\
    --state ${getStateStore(bucket)} \\
    --yes
`, done)
}

/*

  params:

   * name
   * domain
   * bucket

*/
const validateCluster = (params, done) => {
  if (!params.name) return done('name param required for kops.validateCluster')
  if (!params.domain) return done('domain param required for kops.validateCluster')
  if (!params.bucket) return done('bucket param required for kops.validateCluster')

  const { name, domain, bucket } = params

  command(`validate cluster ${name}.${domain} \\
    --state ${getStateStore(bucket)}
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
   * bucket

*/
const exportKubeConfig = (params, done) => {
  if (!params.name) return done('name param required for kops.exportKubeConfig')
  if (!params.domain) return done('domain param required for kops.exportKubeConfig')
  if (!params.kubeConfigPath) return done('kubeConfigPath param required for kops.exportKubeConfig')
  if (!params.bucket) return done('bucket param required for kops.exportKubeConfig')

  const {
    name, domain, kubeConfigPath, bucket,
  } = params

  command(`export kubecfg ${name}.${domain} \\
    --state ${getStateStore(bucket)}
`,
  {
    env: {
      KUBECONFIG: kubeConfigPath,
    },
  },
  done)
}

/*

  process the kubeconfig and extra the ca, cert, key, username and password

  params:

   * name
   * domain
   * kubeConfigPath
   * bucket

*/
const extractKubeConfigAuthDetails = (params, done) => {
  if (!params.name) return done('name param required for kops.extractKubeConfigAuthDetails')
  if (!params.domain) return done('domain param required for kops.extractKubeConfigAuthDetails')
  if (!params.kubeConfigPath) return done('kubeConfigPath param required for kops.extractKubeConfigAuthDetails')

  const { name, domain, kubeConfigPath } = params

  const clusterName = `${name}.${domain}`

  async.waterfall([
    (next) => fs.readFile(kubeConfigPath, 'utf8', next),

    (kubeconfig, next) => {
      let parsedKubeconfig = null
      try {
        parsedKubeconfig = yaml.safeLoad(kubeconfig)
      } catch (e) {
        return next(e.toString())
      }

      const cluster = parsedKubeconfig.clusters.filter((currentCluster) => currentCluster.name === clusterName)[0]
      const user = parsedKubeconfig.users.filter((currentUser) => currentUser.name === clusterName)[0]

      if (!cluster) return next(`no cluster in kubeconfig found for ${clusterName} `)
      if (!user) return next(`no user in kubeconfig found for ${clusterName} `)

      const authDetails = {
        ca: Buffer.from(cluster.cluster['certificate-authority-data'], 'base64').toString(),
        key: Buffer.from(user.user['client-key-data'], 'base64').toString(),
        cert: Buffer.from(user.user['client-certificate-data'], 'base64').toString(),
        username: user.user.username,
        password: user.user.password,
      }

      next(null, authDetails)
    },
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
