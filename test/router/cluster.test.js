'use strict'

const tape = require('tape')
const async = require('async')
const app = require('../app')
const tools = require('../tools')

const fixtures = require('../fixtures')
const userUtils = require('./userUtils')

app.testSuiteWithApp(({
  getConnection,
  url,
}) => {

  const createdClusters = {}

  tape('cluster routes -> setup users', (t) => {
    userUtils.setupUsers({
      url,
      t,
    }, (err) => {
      t.notok(err, `there was no error`)
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
        t.deepEqual(body[0], createdClusters.admin, `the cluster in the list is the same as the created one`)
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })


  

})