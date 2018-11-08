const async = require('async')
const pino = require('pino')({
  name: 'worker.createCluster',
})

const tmp = require('tmp')
const fs = require('fs')
const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const kopsSettings = require('../../templates/kops_settings')
const templateRender = require('../../templates/render')
const Deploy = require('../../utils/deploy')
const shared = require('./create-kops-cluster-shared')

/*

  create a new kops cluster given the cluster settings

  clusterSettings:

    {
      domain: "dev.catenasys.com.",
      master_count: 1,
      master_size: "m1.medium",
      master_zones: ["eu-west-2a"],
      name: "apples",
      node_count: 3,
      node_size: "m1.medium",
      node_zones: ["eu-west-2a"],
      region: "eu-west-2",
      topology: "public",
      public_key: "XXX",
    }

   * generate the values.yaml in the cluster store (from the settings.json)
   * generate the kops.yaml in the cluster store using kubetpl
   * use "kops create -f my-cluster.yaml" to create the cluster
   * create a kops secret from the public key
   * update the cluster

  it will put the cluster into "error" state if there is any kind of error
  loading the cluster

  example commands:

  kops create \
    --state s3://clusters.dev.catenasys.com \
    -f /filestore-data/clusters/apples/kopsconfig.yaml


  kops create secret \
    --name apples.dev.catenasys.com \
    --state s3://clusters.dev.catenasys.com \
    sshpublickey admin -i /filestore-data/clusters/apples/id_rsa.pub

  kops update cluster \
    apples.dev.catenasys.com \
    --state s3://clusters.dev.catenasys.com \
    --yes

  kops validate cluster --name apples.dev.catenasys.com \
     --state s3://clusters.dev.catenasys.com

  kops delete cluster apples.dev.catenasys.com \
    --state s3://clusters.dev.catenasys.com --yes
  
*/


/*

  create the cluster using kops

  params: 

   * name
   * bucket
  
*/
const createClusterTask = (params, store, dispatcher, done) => {

  pino.info({
    action: 'createClusterTask',
    params,
  })

  const bucket = params.bucket

  async.waterfall([

    // load the path to the public key file and the cluster settings
    (nextw) => {
      async.parallel({
        publicKeyFilePath: nextp => nextp(null, store.getLocalClusterFilePath(params.name, 'publicKey')),
        settings: nextp => store.getClusterSettings({
          clustername: params.name
        }, nextp)
      }, nextw)
    },

    // generate the kops values and kops.yaml using kubetpl
    (cluster, nextw) => {
      async.waterfall([

        // output the kopsvalues.yaml into the cluster store
        (nextw1) => {
          store.writeClusterFile({
            clustername: params.name,
            filename: 'kopsValues',
            data: kopsSettings.getYaml(cluster.settings, bucket),
          }, nextw1)
        },

        // generate the kopsconfig.yaml into the cluster store
        // use kubetpl to generate it
        (kopsValuesPath, nextw1) => {
          templateRender(kopsValuesPath, 'kops/cluster.yaml', nextw1)
        },

        // write out the kopsconfig.yaml file into the cluster store
        (kopsConfigYaml, nextw1) => {
          store.writeClusterFile({
            clustername: params.name,
            filename: 'kopsConfig',
            data: kopsConfigYaml,
          }, nextw1)
        }
      ], (err, kopsConfigPath) => {
        if(err) return nextw(err)
        cluster.kopsConfigPath = kopsConfigPath
        nextw(null, cluster)
      })
    },

    (cluster, nextw) => {
      async.series([

        // call the create cluster command
        nexts => {
          const createClusterParams = {
            domain: cluster.settings.domain,
            yamlPath: cluster.kopsConfigPath,
            publicKeyFilePath: cluster.publicKeyFilePath,
            bucket,
          }
          pino.info({
            action: 'kops.createCluster',
            params: createClusterParams,
          })
          kops.createCluster(createClusterParams, nexts)
        },

        // create the cluster secret
        nexts => {
          const createSecretParams = {
            name: params.name,
            domain: cluster.settings.domain,
            publicKeyFilePath: cluster.publicKeyFilePath,
            bucket,
          }
          pino.info({
            action: 'kops.createSecret',
            params: createSecretParams,
          })
          kops.createSecret(createSecretParams, nexts)
        },

        // update the cluster
        nexts => {
          const updateClusterParams = {
            name: params.name,
            domain: cluster.settings.domain,
            bucket,
          }
          pino.info({
            action: 'kops.updateCluster',
            params: updateClusterParams,
          })
          kops.updateCluster(updateClusterParams, nexts)
        }

      ], nextw)
    },
    
  ], done)
}

/*

  export the cluster config files

  params:

   * name
   * domain
   * bucket
  
*/
const exportClusterConfigFilesTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'exportClusterConfigFilesTask',
    params,
  })

  const bucket = params.bucket

  async.series([
    
    // export a kubeconfig file for this cluster
    // this will be used anytime we run `kubectl` against this cluster
    // this will also extract the ca, key and cert from the config
    // so we can use those files to access services via the api server proxy
    next => {

      async.waterfall([

        (wnext) => tmp.file({
          postfix: '',
        }, (err, filepath) => {
          if(err) return wnext(err)
          wnext(null, filepath)
        }),

        (kubeConfigPath, wnext) => {

          const exportKubeConfigParams = {
            name: params.name,
            domain: params.domain,
            kubeConfigPath,
            bucket,
          }

          pino.info({
            action: 'exportKubeConfig',
            params: exportKubeConfigParams,
          })

          kops.exportKubeConfig(exportKubeConfigParams, (err) => {
            if(err) return wnext(err)
            wnext(null, kubeConfigPath)
          })
        },

        (kubeConfigPath, wnext) => fs.readFile(kubeConfigPath, 'utf8', wnext),

        (kubeConfigContents, wnext) => {
          store.writeClusterFile({
            clustername: params.name,
            filename: 'kubeConfig',
            data: kubeConfigContents,
          }, wnext)
        }
      ], next)

    },

    // extract the various auth details from the kubeconfig
    // we write these as files so the proxy can use them
    next => {

      async.waterfall([

        (wnext) => wnext(null, store.getLocalClusterFilePath(params.name, 'kubeConfig')),
        
        (kubeConfigPath, wnext) => {
          const extractKubeConfigAuthDetailsParams = {
            name: params.name,
            domain: params.domain,
            kubeConfigPath,
            bucket,
          }

          pino.info({
            action: 'extractKubeConfigAuthDetails',
            params: extractKubeConfigAuthDetailsParams,
          })

          kops.extractKubeConfigAuthDetails(extractKubeConfigAuthDetailsParams, wnext)
        },

        (authDetails, wnext) => {

          async.parallel([

            // write the ca.pem
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'ca.pem',
                data: authDetails.ca,
              }, nextp)
            },

            // write the admin-key.pem
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'admin-key.pem',
                data: authDetails.key,
              }, nextp)
            },

            // write the admin.pem
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'admin.pem',
                data: authDetails.cert,
              }, nextp)
            },

            // write the username
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'username',
                data: authDetails.username,
              }, nextp)
            },

            // write the password
            nextp => {
              store.writeClusterFile({
                clustername: params.name,
                filename: 'password',
                data: authDetails.password,
              }, nextp)
            },

          ], wnext)
        }
      ], next)

    },

  ], done)
}

const CreateKopsCluster = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  let bucket = null

  async.series([

    next => store.readObjectStoreName((err, b) => {
      if(err) return next(err)
      bucket = b
      next()
    }),

    // first boot the cluster
    next => {
      createClusterTask({
        name: params.name,
        bucket,
      }, store, dispatcher, next)
    },

    // output the cluster config files
    next => {
      exportClusterConfigFilesTask({
        name: params.name,
        domain: params.domain,
        bucket,
      }, store, dispatcher, next)
    },

    // wait for the cluster to be ready
    next => {
      shared.waitClusterReadyTask(pino, {
        name: params.name,
        domain: params.domain,
        bucket,
      }, store, dispatcher, next)
    },

    // deploy the core manifests
    next => {
      shared.deployCoreManifestsTask(pino, {
        name: params.name,
        domain: params.domain,
        bucket,
      }, store, dispatcher, next)
    },

  ], shared.createClusterComplete(pino, params, store, dispatcher))
}

module.exports = CreateKopsCluster