const async = require('async')
const config = require('../config')
const userUtils = require('../utils/user')

const {
  PERMISSION_ROLE_ACCESS_LEVELS,
  CLUSTER_STATUS,
  CLUSTER_PROVISION_TYPE,
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
      if(userUtils.isSuperuser(user)) {
        return loadMostRecentTasksForClusters({
          clusters,
        }, done)
      }

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

        loadMostRecentTasksForClusters({
          clusters,
        }, done)

        
        
      })       
    })
  }

  /*
  
    get a cluster

    params:

     * id
    
  */
  const get = (params, done) => {
    if(!params.id) return done(`id must be given to controller.cluster.update`)
    
    async.parallel({
      cluster: next => store.cluster.get({
        id: params.id,
      }, next),

      task: next => store.task.mostRecentForResource({
        cluster: params.id,
      }, next),

    }, (err, results) => {
      if(err) return done(err)
      const {
        cluster,
        task,
      } = results

      if(cluster && task) {
        cluster.task = task
      }
      done(null, cluster)
    })
    
  }

  /*
  
    load the most recent task for each cluster so the frontend can display
    the task status of clusters in the table

    params:

     * clusters
    
  */
  const loadMostRecentTasksForClusters = ({
    clusters,
  }, done) => {
    async.map(clusters, (cluster, nextCluster) => {
      store.task.mostRecentForResource({
        cluster: cluster.id,
      }, (err, task) => {
        if(err) return nextCluster(err)
        cluster.task = task
        nextCluster(null, cluster)
      })
    }, done)
  }

  /*
  
    extract the cluster secrets from the desired state
    this is so we never save secrets inside of tasks or cluster records
    they are only saved in the clustersecret store (which can be replaced later)
    the desired_state of the cluster will hold a reference to the id of the secret

    will return an object with these props:

     * desired_state - the desired_state with the secrets extracted
     * secrets - an object of name onto an object with either base64Data or rawData
  
  */
  const extracClusterSecrets = ({
    desired_state,
  }) => {

    const secrets = {}

    if(!desired_state) return {
      desired_state,
      secrets,
    }

    if(desired_state.token) {
      secrets.token = {
        base64Data: desired_state.token,
      }
      delete(desired_state.token)
    }

    if(desired_state.ca) {
      secrets.ca = {
        base64Data: desired_state.ca,
      }
      delete(desired_state.ca)
    }

    return {
      desired_state,
      secrets,
    }
  }

  /*
  
    insert the cluster secrets into the store
    and update the cluster desired_state to point at their ids

    params:

     * cluster
     * secrets
  
  */
  const createClusterSecrets = ({
    cluster,
    secrets,
    transaction,
  }, done) => {

    async.waterfall([

      // first - insert the cluster secret data into the database
      (nextw) => {
        async.parallel({
          token: nextp => {
            if(!secrets.token) return nextp()
            store.clustersecret.create({
              data: {
                cluster: cluster.id,
                name: 'token',
                base64Data: secrets.token.base64Data,
              },
              transaction,
            }, nextp)
          },
    
          ca: nextp => {
            if(!secrets.ca) return nextp()
            store.clustersecret.create({
              data: {
                cluster: cluster.id,
                name: 'ca',
                base64Data: secrets.ca.base64Data,
              },
              transaction,
            }, nextp)
          },
        }, nextw)
      },

      // if the secrets were provided - update the desired state to point at the
      // clustersecret id
      // otherwise - use the existing pointers in the actual state
      (secrets, nextw) => {

        const {
          desired_state,
          applied_state,
        } = cluster

        if(secrets.token) {
          desired_state.token = secrets.token.id
        }
        else if(applied_state && applied_state.token) {
          desired_state.token = applied_state.token
        }

        if(secrets.ca) {
          desired_state.ca = secrets.ca.id
        }
        else if(applied_state && applied_state.ca) {
          desired_state.ca = applied_state.ca
        }

        store.cluster.update({
          id: cluster.id,
          data: {
            desired_state,
          },
          transaction,
        }, nextw)
      },

    ], done)
    
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

    const {
      desired_state,
      secrets,
    } = extracClusterSecrets({
      desired_state: data.desired_state,
    })

    store.transaction((transaction, finished) => {

      async.waterfall([

        // create the cluster record
        (next) => store.cluster.create({
          data: {
            name: data.name,
            provision_type: data.provision_type,
            capabilities: data.capabilities,
            desired_state,
          },
          transaction,
        }, next),

        // create the cluster secrets and update the desired_state pointing to them
        (cluster, next) => createClusterSecrets({
          cluster,
          secrets,
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
  
    update a cluster

    params:

      * id
      * user - the user that is updating the cluster
      * data
        * name
        * provision_type
        * desired_state
        * maintenance_flag
    
  */
  const update = (params, done) => {

    const {
      id,
      user,
      data,
    } = params

    if(!id) return done(`id must be given to controller.cluster.update`)
    if(!user) return done(`user must be given to controller.cluster.update`)
    if(!data) return done(`data must be given to controller.cluster.update`)

    const {
      desired_state,
      secrets,
    } = extracClusterSecrets({
      desired_state: data.desired_state,
    })

    // inject the processed desired state into the submission data
    if(desired_state) {
      data.desired_state = desired_state
    }

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

        (ok, next) => store.cluster.update({
          id,
          data,
          transaction,
        }, next),

        (cluster, next) => {
          createClusterSecrets({
            cluster,
            secrets,
            transaction,
          }, next)
        },

        // if desired_state is given - we trigger a new task to update the cluster
        (cluster, next) => {

          if(!data.desired_state) return next(null, cluster)

          store.task.create({
            data: {
              user: user.id,
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

  /*
  
    create a role for a given cluster

    params:

     * id
     * user
     * permission
    
  */
  const createRole = (params, done) => {
    const {
      id,
      user,
      permission,
    } = params

    if(!id) return done(`id must be given to controller.cluster.createRole`)
    if(!user) return done(`user must be given to controller.cluster.createRole`)
    if(!permission) return done(`permission must be given to controller.cluster.createRole`)

    store.role.create({
      data: {
        resource_type: 'cluster',
        resource_id: id,
        user,
        permission,
      },
    }, done)
  }

  /*
  
    delete a role for a given cluster

    params:

     * id
     * user
    
  */
  const deleteRole = (params, done) => {
    const {
      id,
      user,
    } = params

    if(!id) return done(`id must be given to controller.cluster.createRole`)
    if(!user) return done(`user must be given to controller.cluster.createRole`)

    async.waterfall([
      (next) => store.role.listForResource({
        resource_type: 'cluster',
        resource_id: id,
      }, next),

      // find the role for the given user
      (roles, next) => {
        const role = roles.find(role => role.user == user)
        if(!role) return next(`no role for user ${user} found for cluster ${id}`)
        store.role.delete({
          id: role.id,
        }, next)
      }
    ], done)
  }

  /*
  
    get the tasks for a given cluster

    params:

     * id
    
  */
  const getTasks = (params, done) => {
    const {
      id,
    } = params

    if(!id) return done(`id must be given to controller.cluster.getTasks`)

    store.task.list({
      cluster: id,
    }, done)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    getRoles,
    createRole,
    deleteRole,
    getTasks,
  }

}

module.exports = ClusterController