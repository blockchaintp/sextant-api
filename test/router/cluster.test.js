'use strict'

const tape = require('tape')
const async = require('async')
const app = require('../app')
const tools = require('../tools')

const fixtures = require('../fixtures')
const userUtils = require('./userUtils')

const config = require('../../src/config')

const {
  TASK_ACTION,
  TASK_CONTROLLER_LOOP_DELAY,
} = config

const getClusterWithoutTask = (cluster) => {
  const ret = Object.assign({}, cluster)
  delete(ret.task)
  return ret
}

app.testSuiteWithAppTaskHandlers({
  [TASK_ACTION['cluster.create']]: (params, done) => {
    done()
  }
}, ({
  getConnection,
  url,
}) => {

  const createdClusters = {}
  let createdUsers = {}

  tape('cluster routes -> setup users', (t) => {
    userUtils.setupUsers({
      url,
      t,
    }, (err, users) => {
      t.notok(err, `there was no error`)
      createdUsers = users
      t.end()
    })
  })

  tape('cluster routes -> list clusters as all users', (t) => {

    async.eachSeries(Object.keys(userUtils.USERS), (userKey, nextUser) => {
      userUtils.withUser({
        url,
        t,
        user: userUtils.USERS[userKey],
      }, 
      (next) => {
        tools.sessionRequest({
          method: 'get',
          url: `${url}/clusters`,
          json: true,
        }, (err, res, body) => {
          t.notok(err, `there is no error`)
          t.equal(res.statusCode, 200, `200 code`)
          t.deepEqual(body, [], `the body is an empty list of clusters`)
          next()
        })
      }, nextUser)
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> create cluster as normal user', (t) => {

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]

    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.user,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'post',
        url: `${url}/clusters`,
        json: true,
        body: clusterData,
      }, (err, res, body) => {
        t.notok(err, `there was no error`)
        t.equal(res.statusCode, 403, `the request was denied`)
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> create cluster as admin user', (t) => {

    const clusterData = fixtures.SIMPLE_CLUSTER_DATA[0]

    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.admin,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'post',
        url: `${url}/clusters`,
        json: true,
        body: clusterData,
      }, (err, res, body) => {
        t.notok(err, `there was no error`)
        t.equal(res.statusCode, 201, `the cluster was created`)
        const createdCluster = Object.keys(clusterData).reduce((all, key) => {
          all[key] = body[key]
          return all
        }, {})
        t.deepEqual(createdCluster, clusterData, `the returned cluster data was correct`)
        createdClusters.admin = body
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> get cluster as admin user', (t) => {

    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.admin,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'get',
        url: `${url}/clusters/${createdClusters.admin.id}`,
        json: true,
      }, (err, res, body) => {
        t.notok(err, `there was no error`)
        t.equal(res.statusCode, 200, `the cluster was read`)
        t.equal(body.id, createdClusters.admin.id, `the cluster id is correct`)
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> get non existing cluster as super user', (t) => {

    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.superuser,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'get',
        url: `${url}/clusters/1234567`,
        json: true,
      }, (err, res, body) => {
        t.notok(err, `there was no error`)
        t.equal(res.statusCode, 404, `the correct 404 status code is present`)
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> update cluster as admin user', (t) => {

    async.series([

      // wait for the previous create cluster task to be marked as complete
      next => {
        setTimeout(next, TASK_CONTROLLER_LOOP_DELAY * 2)
      },

      next => {
        userUtils.withUser({
          url,
          t,
          user: userUtils.USERS.admin,
        }, 
        (next) => {
          tools.sessionRequest({
            method: 'put',
            url: `${url}/clusters/${createdClusters.admin.id}`,
            json: true,
            body: {
              name: 'new cluster name',
            }
          }, (err, res, body) => {
            t.notok(err, `there was no error`)
            t.equal(res.statusCode, 200, `the cluster was updated`)
            createdClusters.admin.name = 'new cluster name'
            next()
          })
        }, next)
      },

      next => {
        userUtils.withUser({
          url,
          t,
          user: userUtils.USERS.admin,
        }, 
        (next) => {
          tools.sessionRequest({
            method: 'get',
            url: `${url}/clusters/${createdClusters.admin.id}`,
            json: true,
          }, (err, res, body) => {
            t.notok(err, `there was no error`)
            t.equal(res.statusCode, 200, `the cluster was created`)
            t.equal(body.name, createdClusters.admin.name, `the cluster name is correct`)
            next()
          })
        }, (err) => {
          t.notok(err, `there was no error`)
          t.end()
        })
      }
    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> list clusters as admin user', (t) => {
    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.admin,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'get',
        url: `${url}/clusters`,
        json: true,
      }, (err, res, body) => {
        t.notok(err, `there is no error`)
        t.equal(res.statusCode, 200, `200 code`)
        t.equal(body.length, 1, `there is a single cluster in the response`)
        t.deepEqual(getClusterWithoutTask(body[0]), createdClusters.admin, `the cluster in the list is the same as the created one`)
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> add role to normal user', (t) => {

    const createdCluster = createdClusters.admin

    async.series([
      nextSeries => {
        userUtils.withUser({
          url,
          t,
          user: userUtils.USERS.admin,
        }, 
        (next) => {
          tools.sessionRequest({
            method: 'post',
            url: `${url}/clusters/${createdCluster.id}/roles`,
            json: true,
            body: {
              user: createdUsers.user.id,
              permission: 'write',
            },
          }, (err, res, body) => {
            t.equal(res.statusCode, 201, `the status code was correct`)
            t.equal(body.resource_id, createdCluster.id, `the role resource_id was correct`)
            t.equal(body.user, createdUsers.user.id, `the role user was correct`)
            t.equal(body.permission, 'write', `the role permission was correct`)
            next()
          })
        },
        nextSeries)
      },

      nextSeries => {
        userUtils.withUser({
          url,
          t,
          user: userUtils.USERS.user,
        }, 
        (next) => {
          tools.sessionRequest({
            method: 'get',
            url: `${url}/clusters`,
            json: true,
          }, (err, res, body) => {
            t.equal(res.statusCode, 200, `the status code was correct`)
            t.equal(body.length, 1, `there was one cluster`)
            t.equal(body[0].id, createdCluster.id, `the cluster id was correct`)
            next()
          })
        },
        nextSeries)
      }
    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> get roles', (t) => {

    const createdCluster = createdClusters.admin

    userUtils.withUser({
      url,
      t,
      user: userUtils.USERS.admin,
    }, 
    (next) => {
      tools.sessionRequest({
        method: 'get',
        url: `${url}/clusters/${createdCluster.id}/roles`,
        json: true,
      }, (err, res, body) => {
        t.equal(res.statusCode, 200, `the status code was correct`)
        t.equal(body.length, 2, `there are 2 roles for this cluster`)
        next()
      })
    },
    (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })

  tape('cluster routes -> delete role for normal user', (t) => {

    const createdCluster = createdClusters.admin

    async.series([
      nextSeries => {
        userUtils.withUser({
          url,
          t,
          user: userUtils.USERS.admin,
        }, 
        (next) => {
          tools.sessionRequest({
            method: 'delete',
            url: `${url}/clusters/${createdCluster.id}/roles/${createdUsers.user.id}`,
            json: true,
          }, (err, res, body) => {
            t.equal(res.statusCode, 200, `the status code was correct`)
            next()
          })
        },
        nextSeries)
      },

      nextSeries => {
        userUtils.withUser({
          url,
          t,
          user: userUtils.USERS.user,
        }, 
        (next) => {
          tools.sessionRequest({
            method: 'get',
            url: `${url}/clusters`,
            json: true,
          }, (err, res, body) => {
            t.equal(res.statusCode, 200, `the status code was correct`)
            t.equal(body.length, 0, `there are no clusters`)
            next()
          })
        },
        nextSeries)
      }
    ], (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })
  
})