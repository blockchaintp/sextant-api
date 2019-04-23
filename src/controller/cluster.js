const async = require('async')
const config = require('../config')
const userUtils = require('../utils/user')

const {
  PERMISSION_ROLE_ACCESS_LEVELS,
} = config

const ClusterController = ({ store, settings }) => {
  
  /*
  
    list clusters

    params:

     * user - the user that is viewing the list
     * deleted - include deleted clusters in the list

    if the is an superuser role - then load all clusters

    otherwise, load clusters that have at least a read role for the
    given user

  */
  const list = (params, done) => {

    const {
      user,
      deleted,
    } = params

    if(!user) return done(`user required for controllers.cluster.list`)

    store.cluster.list({
      deleted,
    }, (err, clusters) => {
      if(err) return done(err)

      // if it's a superuser - they can see all clusters
      if(userUtils.isSuperuser(user)) return done(null, clusters)

      // we need to load the roles that are for a cluster for the user
      store.role.listForUser({
        user: user.id,
      }, (err, roles) => {
        if(err) return done(err)

        const roleMap = roles
          .filter(role => role.resource_type == config.RESOURCE_TYPES.cluster)
          .reduce((all, role) => {
            all[role.resource_id] = role
            return all
          }, {})

        clusters = clusters.filter(cluster => {
          const clusterRole = roleMap[cluster.id]
          if(!clusterRole) return false
          return PERMISSION_ROLE_ACCESS_LEVELS[clusterRole.permission] >= PERMISSION_ROLE_ACCESS_LEVELS.read
        })

        done(null, clusters)
      })       
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
    
    if the user is not an superuser - we create a write role for that
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
          if(userUtils.isSuperuser(user)) return next(null, cluster)

          store.role.create({
            data: {
              user: user.id,
              permission: config.PERMISSION_ROLE.write,
              resource_type: config.RESOURCE_TYPES.cluster,
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
              resource_type: config.RESOURCE_TYPES.cluster,
              resource_id: cluster.id,
              action: config.TASK_ACTION['cluster.create'],
              restartable: true,
              payload: {},
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
    if(!params.id) return done(`id must be given to controller.cluster.update`)
    
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
              resource_type: config.RESOURCE_TYPES.cluster,
              resource_id: cluster.id,
              action: config.TASK_ACTION['cluster.update'],
              restartable: true,
              payload: {},
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

     * user - the user that is creating the cluster  
     * id
    
  */
  const del = (params, done) => {

    const {
      user,
      id,
    } = params

    if(!user) return done(`user required for controllers.cluster.delete`)
    if(!id) return done(`id must be given to controller.cluster.delete`) 

    
    // check to see if there is a running or cancelling tasks for the given cluster
    // if there is, don't allow the update

    store.transaction((transaction, finished) => {

      async.waterfall([

        (next) => {
          store.task.activeForResource({
            cluster: id,
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
              desired_state: {
                deleted: true,
              },
            },
            transaction,
          }, next)
        },

        (cluster, next) => {

          store.task.create({
            data: {
              user: params.user.id,
              resource_type: config.RESOURCE_TYPES.cluster,
              resource_id: cluster.id,
              action: config.TASK_ACTION['cluster.delete'],
              restartable: true,
              payload: {},
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
  
    get the roles for a given cluster

    params:

     * id
    
  */
  const getRoles = (params, done) => {
    const {
      id,
    } = params

    if(!id) return done(`id must be given to controller.cluster.getRoles`)

    async.waterfall([
      (next) => store.role.listForResource({
        resource_type: 'cluster',
        resource_id: id,
      }, next),

      // load the user for each role
      (roles, next) => {
        async.map(roles, (role, nextRole) => {
          store.user.get({
            id: role.user,
          }, (err, user) => {
            if(err) return nextRole(err)
            role.userRecord = userUtils.safe(user)
            nextRole(null, role)
          })
        }, next)
      }
    ], done)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    getRoles,
  }

}

module.exports = ClusterController