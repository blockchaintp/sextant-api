const async = require('async')
const sshUtils = require('../utils/ssh')
const clusterUtils = require('../utils/cluster')

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
  
    get a cluster given it's id

    params:

     * id - string
    
  */
  const get = (params, done) => store.getCluster({
    clustername: params.id,
  }, done)


  /*
  
    get a cluster status given it's id

    params:

     * id - string
    
  */
  const status = (params, done) => store.getClusterStatus({
    clustername: params.id,
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
        store.createCluster(settings, next)
      },

      // now that the cluster settings have been persisted
      // dispatch the "create-cluster" job that will make the kops cluster
      // it will then call the "wait-cluster-created" job that will update
      // the status once the cluster is ready
      next => {
        jobDispatcher({
          name: 'createCluster',
          params: settings,
        }, next)
      },

    ], done)
  }

  /*
  
    generate an ssh keypair and return an object with:

     * publicKey
     * privateKey

    the keys do not remain on disk once created
    
  */
  const createKeypair = (params, done) => sshUtils.createKeypair(done)

  return {
    list,
    get,
    status,
    create,
    createKeypair,
  }

}

module.exports = ClustersBackend