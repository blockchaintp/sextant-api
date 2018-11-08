const path = require('path')
const async = require('async')
const fs = require('fs')
const rmdir = require('rmdir')
const settings = require('../../settings')
const S3 = require('../../utils/s3')
const packageJSON = require('../../../package.json')

const pino = require('pino')({
  name: 's3.remote',
})

const FILENAMES = {
  sextantVersion: 'sextantVersion',
}

const S3Remote = () => {

  let s3 = null
  let bucketName = null
  let storagePath = null
  let initialized = false

  // ensure an existing bucket is ok to use
  const setupExisting = (temps3, localBucketName, done) => {
    async.series([

      // check the bucket is a pre-allocated sextant storage bucket
      next => {
        temps3.statFile('clusters/sextantVersion', (err, exists) => {
          if(err) return next(err)
          if(!exists) {
            const errorMessage = `A bucket called ${localBucketName} already exists but it's not a sextant storage bucket`
            pino.error({
              type: 'bucketExistsNotSextant',
              error: errorMessage,
            })
            return next(errorMessage)
          }
          next()
        })
      },

    ], (err) => {
      if(err) return done(err)
      return done(null, true)
    })
    
  }

  // create a new bucket
  const setupNew = (temps3, localBucketName, done) => {
    async.series([

      // create the bucket
      next => temps3.createBucket(next),

      // write an empty users file
      next => temps3.writeFile('users.json', '[]', next),

      // make sure there is a clusters folder
      next => temps3.createFolder('clusters', next),

      // write the sextantVersion file
      next => temps3.writeFile('clusters/sextantVersion', packageJSON.version.toString(), next),

      // make sure there is a kopsState folder
      next => temps3.createFolder('kopsState', next),

    ], (err) => {
      if(err) return done(err)
      return done(null, true)
    })
  }

  // pull the contents of the remote bucket to the local fs
  const synchronizeLocal = (temps3, localStoragePath, done) => {

    const CLUSTER_DIR = path.join(localStoragePath, 'clusters')
    const USERS_FILE = path.join(localStoragePath, 'users.json')

    async.series([

      // delete the local clusters folder
      next => {
        fs.stat(CLUSTER_DIR, (err, stat) => {
          if(err || !stat) return next()
          rmdir(CLUSTER_DIR, next)
        })
      },

      // delete the local users file
      next => {
        fs.stat(USERS_FILE, (err, stat) => {
          if(err || !stat) return next()
          fs.unlink(USERS_FILE, next)
        })
      },

      // download the remote clusters folder
      next => temps3.folderDownload(CLUSTER_DIR, 'clusters', next),

      // download the remote users file
      next => temps3.fileDownload(USERS_FILE, 'users.json', next),
    ], done)
    
  }

  const setup = (localBucketName, localStoragePath, done) => {
    const temps3 = S3(localBucketName)

    async.waterfall([

      // check if the bucket exists
      (next) => temps3.bucketExists(next),

      // either create the new bucket or check the status of the existing one
      (exists, next) => {
        if(exists) {
          pino.info({
            type: 'bucketExists',
            name: localBucketName,
          })
          setupExisting(temps3, localBucketName, next)
        }
        else {
          pino.info({
            type: 'bucketDoesNotExist',
            name: localBucketName,
          })
          setupNew(temps3, localBucketName, next)
        }
      },

      // download the contents of the bucket to the local filesystem
      (ok, next) => synchronizeLocal(temps3, localStoragePath, next)
      
    ], (err) => {

      if(err) return done(err)

      pino.info({
        type: 'remoteInitialized',
      })
      
      s3 = temps3
      bucketName = localBucketName
      storagePath = localStoragePath
      initialized = true
      done()
    })
  }

  return {
    setup,
    isInitialized: () => initialized,
    createFolder: (folderPath, done) => {
      if(!s3) return done(`s3 remote not initialized`)
      s3.createFolder(folderPath, done)
    },
    writeFile: (filePath, data, done) => {
      if(!s3) return done(`s3 remote not initialized`)
      s3.writeFile(filePath, data, done)
    },
    deleteFolder: (folderPath, done) => {
      if(!s3) return done(`s3 remote not initialized`)
      s3.deleteFolder(folderPath, done)
    },
  }

}

module.exports = S3Remote