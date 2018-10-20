const async = require('async')
const pino = require('pino')({
  name: 'worker.createCluster',
})

const settings = require('../../settings')
const kops = require('../../utils/kops')
const clusterUtils = require('../../utils/cluster')
const kopsSettings = require('../../templates/kops_settings')
const templateRender = require('../../templates/render')
const Deploy = require('../../utils/deploy')

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
  
*/
const createClusterTask = (params, store, dispatcher, done) => {

  pino.info({
    action: 'createClusterTask',
    params,
  })

  async.waterfall([

    // load the path to the public key file and the cluster settings
    (nextw) => {
      async.parallel({
        publicKeyFilePath: nextp => store.getClusterFilePath({
          clustername: params.name,
          filename: 'publicKey'
        }, nextp),

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
            data: kopsSettings.getYaml(cluster.settings),
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

  wait for the cluster to be ready

  params:

   * name
   * domain
  
*/

const waitClusterReadyTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'waitClusterReadyTask',
    params,
  })

  let lastExitCode = 1
  let attempts = 0

  async.whilst(

    // keep looping until the 'validate' exit code is zero
    () => lastExitCode > 0,

    (next) => {
      attempts++
      if(attempts > settings.validateClusterAttempts) return next(`cluster has not validated after ${settings.validateClusterAttempts} attempts`)

      pino.info({
        action: 'validateCluster',
        params,
      })
    
      // validate the cluster and expect an error if the cluster is not ready
      // the lack of an error means we got a zero exit code and the loop will end
      kops.validateCluster(params, (err) => {
        if(err) {
          lastExitCode = err.code
          setTimeout(next, settings.validateClusterDelay)
        }
        else {
          lastExitCode = 0
          next()
        }
      })
    },

    done
  )
}

/*

  export the cluster config files

  params:

   * name
   * domain
  
*/
const exportClusterConfigFilesTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'exportClusterConfigFilesTask',
    params,
  })

  async.series([
    
    // export a kubeconfig file for this cluster
    // this will be used anytime we run `kubectl` against this cluster
    // this will also extract the ca, key and cert from the config
    // so we can use those files to access services via the api server proxy
    next => {

      async.waterfall([
        (wnext) => store.getClusterFilePath({
          clustername: params.name,
          filename: 'kubeConfig',
        }, wnext),

        (kubeConfigPath, wnext) => {
          const exportKubeConfigParams = {
            name: params.name,
            domain: params.domain,
            kubeConfigPath
          }

          pino.info({
            action: 'exportKubeConfig',
            params: exportKubeConfigParams,
          })

          kops.exportKubeConfig(exportKubeConfigParams, wnext)
        },
      ], next)

    },

    // extract the various auth details from the kubeconfig
    // we write these as files so the proxy can use them
    next => {

      async.waterfall([
        (wnext) => store.getClusterFilePath({
          clustername: params.name,
          filename: 'kubeConfig',
        }, wnext),

        (kubeConfigPath, wnext) => {
          const extractKubeConfigAuthDetailsParams = {
            name: params.name,
            domain: params.domain,
            kubeConfigPath
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


/*

  deploy the core manifests

  params:

   * name
   * domain
  
*/
const deployCoreManifestsTask = (params, store, dispatcher, done) => {
  pino.info({
    action: 'deployCoreManifestsTask',
    params,
  })

  async.waterfall([

    // get a kubectl that is bound to the given cluster
    (next) => clusterUtils.getKubectl(store, params.name, next),

    (kubectl, next) => {

      const deploy = Deploy({
        kubectl
      })

      async.series([

        // create the cluster admin service account
        nexts => deploy.createClusterAdminServiceAccount({}, nexts),

        // create the dashboard service account
        nexts => deploy.createDashboardServiceAccount({}, nexts),
        
        // deploy the dashboard
        nexts => deploy.dashboard({}, nexts),

        // deploy the route53 mapper
        nexts => deploy.route53Mapper({}, nexts),

      ], next)
      
    },

  ], done)
}

const CreateKopsCluster = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.series([

    // first boot the cluster
    next => {
      createClusterTask(params, store, dispatcher, next)
    },

    // wait for the cluster to be ready
    next => {
      waitClusterReadyTask({
        name: params.name,
        domain: params.domain,
      }, store, dispatcher, next)
    },

    // output the cluster config files
    next => {
      exportClusterConfigFilesTask({
        name: params.name,
        domain: params.domain,
      }, store, dispatcher, next)
    },

    // deploy the core manifests
    next => {
      deployCoreManifestsTask({
        name: params.name,
        domain: params.domain,
      }, store, dispatcher, next)
    },

  ], (err) => {
    if(err) {

      pino.error({
        action: 'error',
        params,
        error: err,
      })

      // if there has been an error in creating the cluster - tell the store
      // to put the cluster into an error state
      store.setClusterError({
        clustername: params.name,
        error: err.toString(),
        errorPhase: 'create',
      }, () => {})
    }
    else {

      pino.info({
        action: 'success',
        params,
      })

      // everything is ready - put the cluster into a 'created' state
      store.updateClusterStatus({
        clustername: params.name,
        status: {
          phase: 'created',
        }
      }, () => {})
    }
  })
}

module.exports = CreateKopsCluster