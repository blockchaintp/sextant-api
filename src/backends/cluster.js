const async = require('async')
const sshUtils = require('../utils/ssh')
const clusterUtils = require('../utils/cluster')
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
    const settings = clusterUtils.processClusterSettings(params)
  
    pino.info({
      action: 'create',
      params,
    })

    async.series([

      // validate the given settings
      next => {
        const errors = clusterUtils.validateClusterSettings(settings)
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
      // it will then call the "wait-cluster-created" job that will update
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

  /*
  
    deploy the sawtooth manifests onto a cluster

    params: 

     * name
    
  */
  const deploy = (params, done) => {
    pino.info({
      action: 'deploy',
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

      // check the cluster is in the "created" phase
      next => {
        store.getClusterStatus({
          clustername: params.name,
        }, (err, status) => {
          if(err) return next(err)
          if(status.phase != 'created') return next(`The ${params.name} cluster is not in the "created" phase so it cannot be deployed`)
          next()
        })
      },

      // dispatch the deploy manifests job
      next => {
        const jobParams = {
          name: params.name,
        }
        pino.info({
          action: 'job.deploySawtoothManifests',
          params: jobParams,
        })
        jobDispatcher({
          name: 'deploySawtoothManifests',
          params: jobParams,
        }, next)
      },

    ], done)
  }

  // route used for testing
  const test = (p, done) => {

    const params = {
      name: 'oranges5',
      domain: 'dev.catenasys.com',
    }

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

        kops.extractKubeConfigAuthDetails(extractKubeConfigAuthDetailsParams, wnext)
      },
    ], done)
  }

  return {
    list,
    get,
    status,
    create,
    destroy,
    cleanup,
    createKeypair,
    getClusterFilepath,
    deploy,
    test,
  }

}

module.exports = ClustersBackend