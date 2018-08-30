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
    
  */
  const create = (params, done) => {
    done()
  }


  return {
    list,
    get,
    create,
  }

}

module.exports = ClustersBackend