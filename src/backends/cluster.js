const async = require('async')
const sshUtils = require('../utils/ssh')
const clusterUtils = require('../utils/cluster')

const pino = require('pino')({
  name: 'backend.clusters',
})

const ClustersBackend = ({ store }) => {
  
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
      master_size: 1,
      master_type: "m1.medium",
      master_zones: ["eu-west-2a"],
      name: "apples",
      node_size: 3,
      node_type: "m1.medium",
      node_zones: ["eu-west-2a"],
      region: "eu-west-2",
      topology: "public",
      public_key: "XXX",
    }
    
  */
  const create = (params, done) => {

    async.series([

      // validate the given params
      next => {
        const errors = clusterUtils.validateClusterSettings(params)
        if(errors) return next(errors)
        next()
      },

      // check there is not a cluster with that name
      next => {
        store.listClusterNames({}, (err, clusterNames) => {
          if(err) return next(err)
          const existingCluster = clusterNames.filter(clusterName => clusterName == params.name)[0]
          if(existingCluster) return next(`There is already a cluster with the name ${params.name}`)
          next()
        })
      },

      // save the cluster settings in the store
      next => {
        store.createCluster(params, next)
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