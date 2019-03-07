const ClusterController = ({ store, settings }) => {
  
  /*
  
    list clusters

    params:

     * user - the user that is viewing the list

    if the is an admin role - then load all clusters

    otherwise, load clusters that have at least a read role for the
    given user

  */
  const list = (params, done) => {
    store.cluster.list({}, (err, clusters) => {
      if(err) return done(err)

      // TODO: filter clusters based on user
      done(null, clusters)
    })
  }

  /*
  
    create a new cluster

    params:

     * user - the user that is creating the cluster
     * data
       * name
       * provision_type
       * desired_state
       * capabilities
    
    if the user is not an admin - we create a write role for that
    user on this cluster
    
  */
  const create = (params, done) => {
    store.cluster.create({
      name: params.name,
      provision_type: params.provision_type,
      desired_state: params.desired_state,
      capabilities: params.capabilities,
    }, (err, cluster) => {
      if(err) return done(err)

      // TODO: create write role for user
      done(null, cluster)
    })
  }

  /*
  
    get a cluster

    params:

     * id
    
  */
  const get = (params, done) => {
    store.cluster.get({
      id: params.id,
    }, done)
  }

  /*
  
    update a cluster

    params:

      * id
      * data
        * desired_state
        * maintenance_flag
    
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to controller.cluster.update`)
    if(!params.data) return done(`data must be given to controller.cluster.update`)

    store.cluster.update({
      id: params.id,
      data: {
        desired_state: params.desired_state,
        maintenance_flag: params.maintenance_flag,
      }
    }, done)
    
  }

  /*
  
    delete a cluster

    params:

     * id
    
  */
  const del = (params, done) => {
    if(!params.id) return done(`id must be given to controller.cluster.delete`) 

    store.cluster.delete({
      id: params.id,
    }, done)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
  }

}

module.exports = ClusterController