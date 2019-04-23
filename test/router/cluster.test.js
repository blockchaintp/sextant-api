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
        console.log('--------------------------------------------')
        console.dir(body)
        next()
      })
    }, (err) => {
      t.notok(err, `there was no error`)
      t.end()
    })
  })


})