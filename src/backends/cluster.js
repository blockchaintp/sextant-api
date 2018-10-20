const async = require('async')
const sshUtils = require('../utils/ssh')
const clusterUtils = require('../utils/cluster')
const kopsSettings = require('../templates/kops_settings')
const sawtoothSettings = require('../templates/sawtooth_settings')
const kops = require('../utils/kops')

const pino = require('pino')({
  name: 'backend.clusters',
})

const ClustersBackend = ({ store, jobDispatcher }) => {
  
  /*
  
    list the current clusters

    params:

    returns:

      array[string]

  */
  const list = (params, done) => store.listClusters({}, done)

  /*
  
    get a cluster given it's name

    params:

     * name - string
    
  */
  const get = (params, done) => store.getCluster({
    clustername: params.name,
  }, done)


  /*
  
    get a cluster status given it's name

    params:

     * name - string
    
  */
  const status = (params, done) => store.getClusterStatus({
    clustername: params.name,
  }, done)


  /*
  
    load the various info for a running cluster

    params:

     * name - string
    
  */
  const info = (params, done) => {

    async.waterfall([

      (next) => {
        async.parallel({
          kubectl: nextp => clusterUtils.getKubectl(store, params.name, nextp),
          deploymentSettings: nextp => store.getDeploymentSettings({
            clustername: params.name,
          }, nextp)
        }, next)
      },

      (resources, next) => {

        const { kubectl, deploymentSettings } = resources

        async.parallel({
          pods: nextp => kubectl.command('get all -o wide', nextp),
          podJson: nextp => kubectl.jsonCommand({
            command: 'get po'
          }, nextp),
          serviceJson: nextp => kubectl.jsonCommand({
            command: 'get svc'
          }, nextp),
          statefulSetJson: nextp => kubectl.jsonCommand({
            command: 'get statefulset'
          }, nextp),
          grafana: nextp => kubectl.jsonCommand({
            command: 'get services grafana',
            allowFail: true,
          }, nextp),
          xodemo: nextp => kubectl.jsonCommand({
            command: `get services ${deploymentSettings.network_name}-xo-demo`,
            allowFail: true,
          }, nextp),
        }, next)

      }
    ], done)
  }


  /*
  
    create a cluster

    params:

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
    
  */
  const create = (params, done) => {

    // process the incoming settings
    const settings = kopsSettings.processSettings(params)
  
    pino.info({
      action: 'create',
      params,
    })

    async.series([

      // validate the given settings
      next => {
        const errors = kopsSettings.validateSettings(settings)
        if(errors) return next(errors)
        next()
      },

      // check there is not a cluster with that name
      next => {
        store.listClusterNames({}, (err, clusterNames) => {
          if(err) return next(err)
          const existingCluster = clusterNames.filter(clusterName => clusterName == settings.name)[0]
          if(existingCluster) return next(`There is already a cluster with the name ${settings.name}`)
          next()
        })
      },

      // save the cluster settings in the store
      next => {
        pino.info({
          action: 'store.createCluster',
          params: {
            settings
          },
        })
        store.createCluster(settings, next)
      },

      // now that the cluster settings have been persisted
      // dispatch the "create-cluster" job that will make the kops cluster
      // it will then wait by calling "kops validate" that will update
      // the status once the cluster is ready
      next => {
        pino.info({
          action: 'job.createCluster',
          params: {
            settings
          },
        })
        jobDispatcher({
          name: 'createCluster',
          params: settings,
        }, next)
      },

    ], done)
  }

  /*
  
    deploy a cluster

    params:

     * name
     * settings

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
  const deploy = (params, done) => {

    // process the incoming settings
    const settings = sawtoothSettings.processSettings(params.settings)
  
    pino.info({
      action: 'deploy',
      params,
    })

    async.series([

      // validate the given settings
      next => {
        const errors = sawtoothSettings.validateSettings(settings)
        if(errors) return next(errors)
        next()
      },

      // check there is a cluster with that name
      next => {
        store.listClusterNames({}, (err, clusterNames) => {
          if(err) return next(err)
          const existingCluster = clusterNames.filter(clusterName => clusterName == params.name)[0]
          if(!existingCluster) return next(`There is no cluster with the name ${params.name}`)
          next()
        })
      },

      // save the deployment settings in the store
      next => {
        pino.info({
          action: 'store.saveDeploymentSettings',
          params: {
            settings
          },
        })
        store.writeClusterFile({
          clustername: params.name,
          filename: 'deploymentSettings',
          data: JSON.stringify(settings),
        }, next)
      },

      // update the cluster status as deploying
      next => {
        const updateClusterStatusParams = {
          clustername: params.name,
          status: {
            phase: 'deploying'
          },
        }
        pino.info({
          action: 'store.updateClusterStatus',
          params: updateClusterStatusParams,
        })
        store.updateClusterStatus(updateClusterStatusParams, next)
      },

      // dispatch the "deploy-cluster" job that will kubectl apply the manifests
      // it will then check the status of the manifests and update
      // the status once the pods are ready
      next => {
        const deployClusterParams = {
          name: params.name,
          settings,
        }
        pino.info({
          action: 'job.deploySawtooth',
          params: deployClusterParams
        })
        jobDispatcher({
          name: 'deploySawtooth',
          params: deployClusterParams,
        }, next)
      },

    ], done)
  }

  /*
  
    undeploy a cluster

    this means remove the k8s resources but leave the cluster intact

    params:

     * name
    
  */
  const undeploy = (params, done) => {

    pino.info({
      action: 'deploy',
      params,
    })

    async.series([

      // check there is a cluster with that name
      next => {
        store.listClusterNames({}, (err, clusterNames) => {
          if(err) return next(err)
          const existingCluster = clusterNames.filter(clusterName => clusterName == params.name)[0]
          if(!existingCluster) return next(`There is no cluster with the name ${params.name}`)
          next()
        })
      },

      // update the cluster status as undeploying
      next => {
        const updateClusterStatusParams = {
          clustername: params.name,
          status: {
            phase: 'undeploying'
          },
        }
        pino.info({
          action: 'store.updateClusterStatus',
          params: updateClusterStatusParams,
        })
        store.updateClusterStatus(updateClusterStatusParams, next)
      },

      // dispatch the "deploy-cluster" job that will kubectl apply the manifests
      // it will then check the status of the manifests and update
      // the status once the pods are ready
      next => {
        const undeployClusterParams = {
          name: params.name,
        }
        pino.info({
          action: 'job.undeploySawtooth',
          params: undeployClusterParams
        })
        jobDispatcher({
          name: 'undeploySawtooth',
          params: undeployClusterParams,
        }, next)
      },

    ], done)
  }

  /*
  
    destroy a cluster

    this will keep the state intact until the "cleanup" action is called

    this is so they can see the "deleting" progress in the UI

    params: 

     * name
    
  */
  const destroy = (params, done) => {

    pino.info({
      action: 'destroy',
      params
    })

    async.series([

      // check there is a cluster with that name
      next => {
        store.listClusterNames({}, (err, clusterNames) => {
          if(err) return next(err)
          const existingCluster = clusterNames.filter(clusterName => clusterName == params.name)[0]
          if(!existingCluster) return next(`There is no cluster with the name ${params.name}`)
          next()
        })
      },

      // dispatch the delete cluster job
      next => {

        async.waterfall([

          // load the cluster settings so we know the domain (needed by the kops job)
          (nextw) => store.getClusterSettings({
            clustername: params.name
          }, nextw),

          // dispatch the destroyCluster job
          (clusterSettings, nextw) => {
            const jobParams = {
              name: clusterSettings.name,
              domain: clusterSettings.domain,
            }
            pino.info({
              action: 'job.destroyCluster',
              params: jobParams,
            })
            jobDispatcher({
              name: 'destroyCluster',
              params: jobParams,
            }, nextw)
          }

        ], next)
        
      },

      // update the cluster status to deleting
      next => {
        const updateClusterStatusParams = {
          clustername: params.name,
          status: {
            phase: 'deleting',
          }
        }
        pino.info({
          action: 'store.updateClusterStatus',
          params: updateClusterStatusParams,
        })
        store.updateClusterStatus(updateClusterStatusParams, next)
      },

    ], done)
  }

  /*
  
    cleanup a cluster

    can only be called in the "deleted" state

    this will remove the cluster from the store so it can be re-created

    params: 

     * name
    
  */
  const cleanup = (params, done) => {

    pino.info({
      action: 'cleanup',
      params
    })

    async.series([

      // check there is a cluster with that name
      next => {
        store.listClusterNames({}, (err, clusterNames) => {
          if(err) return next(err)
          const existingCluster = clusterNames.filter(clusterName => clusterName == params.name)[0]
          if(!existingCluster) return next(`There is no cluster with the name ${params.name}`)
          next()
        })
      },

      // check the cluster is in the "deleted" phase
      next => {
        store.getClusterStatus({
          clustername: params.name,
        }, (err, status) => {
          if(err) return next(err)
          if(status.phase != 'deleted') return next(`The ${params.name} cluster is not in the "deleted" phase so it cannot be cleaned up`)
          next()
        })
      },

      // update the cluster status to deleting
      next => {
        const destroyClusterParams = {
          clustername: params.name,
        }
        pino.info({
          action: 'store.destroyCluster',
          params: destroyClusterParams
        })
        store.destroyCluster(destroyClusterParams, next)
      },

    ], done)
  }

  /*
  
    generate an ssh keypair and return an object with:

     * publicKey
     * privateKey

    the keys do not remain on disk once created
    
  */
  const createKeypair = (params, done) => {
    pino.info({
      action: 'createKeypair',
      params
    })
    sshUtils.createKeypair(done)
  }

  /*
  
    get a filepath for a cluster

     * name
     * filename
    
  */
  const getClusterFilepath = (params, done) => {
    store.getClusterFilePath({
      clustername: params.name,
      filename: params.filename,
    }, done)
  }


  return {
    list,
    get,
    status,
    info,
    create,
    deploy,
    undeploy,
    destroy,
    cleanup,
    createKeypair,
    getClusterFilepath,
  }

}

module.exports = ClustersBackend