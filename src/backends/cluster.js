const sshUtils = require('../utils/ssh')

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
    id: params.id,
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
    }
    
  */
  const create = (params, done) => {

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.dir(params)
    done()
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
    create,
    createKeypair,
  }

}

module.exports = ClustersBackend