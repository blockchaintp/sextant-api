const async = require('async')

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

    const {
      user,
      data,
    } = params
    
    if(!user) return done(`user required for controllers.cluster.create`)
    if(!data) return done(`data required for controllers.cluster.create`)
    if(!data.name) return done(`data.name required for controllers.cluster.create`)
    if(!data.provision_type) return done(`data.provision_type required for controllers.cluster.create`)
    if(!data.desired_state) return done(`data.desired_state required for controllers.cluster.create`)

    store.transaction((transaction, finished) => {

      async.waterfall([

        // create the cluster record
        (next) => store.cluster.create({
          data: {
            name: data.name,
            provision_type: data.provision_type,
            desired_state: data.desired_state,
            capabilities: data.capabilities,
          },
          transaction,
        }, next),

        // create the user role if needed
        (cluster, next) => {
          if(user.role == 'admin') return next(null, cluster)

          store.role.create({
            data: {
              user: user.id,
              permission: 'write',
              resource_type: 'cluster',
              resource_id: cluster.id,
            },
            transaction,
          }, (err, role) => {
            if(err) return next(err)
            next(null, cluster)
          })
        },

        // create the task to create the cluster
        (cluster, next) => {
          store.task.create({
            data: {
              user: user.id,
              resource_type: 'cluster',
              resource_id: cluster.id,
              restartable: true,
              payload: {
                type: 'cluster.create',
                clusterid: cluster.id,
                provision_type: cluster.provision_type,
                desired_state: cluster.desired_state,
                capabilities: cluster.capabilities,
              }
            },
            transaction,
          }, (err, task) => {
            if(err) return next(err)
            next(null, cluster)
          })
        },

      ], finished)
    }, done)
    
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
      * user - the user that is updating the cluster
      * data
        * desired_state
        * maintenance_flag
    
  */
  const update = (params, done) => {
    if(!params.id) return done(`id must be given to controller.cluster.update`)
    if(!params.user) return done(`user must be given to controller.cluster.update`)
    if(!params.data) return done(`data must be given to controller.cluster.update`)

    // check to see if there is a running or cancelling tasks for the given cluster
    // if there is, don't allow the update

    store.transaction((transaction, finished) => {

      throw new Error('apples')
      async.waterfall([

        (next) => {
          store.task.activeForResource({
            cluster: params.id,
          }, (err, activeTasks) => {
            if(err) return next(err)
            if(activeTasks.length > 0) return next(`there are active tasks for this cluster`)
            next(null, true)
          })
        },

        (ok, next) => {
          store.cluster.update({
            id: params.id,
            data: {
              desired_state: params.data.desired_state,
              maintenance_flag: params.data.maintenance_flag,
            },
            transaction,
          }, next)
        },

        // if desired_state is given - we trigger a new task to update the cluster
        (cluster, next) => {

          if(!params.data.desired_state) return next(null, cluster)

          store.task.create({
            data: {
              user: params.user.id,
              resource_type: 'cluster',
              resource_id: cluster.id,
              restartable: true,
              payload: {
                type: 'cluster.update',
                clusterid: cluster.id,
                provision_type: cluster.provision_type,
                desired_state: cluster.desired_state,
                capabilities: cluster.capabilities,
              }
            },
            transaction,
          }, (err, task) => {
            if(err) return next(err)
            next(null, cluster)
          })
        },

      ], finished)

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