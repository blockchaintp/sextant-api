const S3FS = require('s3fs')
const S3 = require('s3')
const fs = require('fs')
const async = require('async')
const aws = require('./aws')
const AWS = require('aws-sdk')
const settings = require('../settings')

const pino = require('pino')({
  name: 's3',
})

const S3Factory = (name) => {
  const sdkS3 = new AWS.S3({
	  signatureVersion:'v4'
  })
  const s3fs = new S3FS(name, sdkS3
  )
  const client = S3.createClient({
	  s3Client:sdkS3,
  })
  return {
    s3fs,
    client,
    // used to download the clusters folder
    folderDownload: (localDir, prefix, done) => {
      const emitter = client.downloadDir({
        localDir,
        deleteRemoved: true,
        s3Params: {
          Prefix: prefix,
          Bucket: name,
        }
      })

      emitter.on('error', done)
      emitter.on('end', done)
      emitter.on('fileDownloadStart', (localpath, s3key) => {
        pino.info({
          action: 'download.start',
          localpath,
          s3key,
        })
      })
      emitter.on('fileDownloadEnd', (localpath, s3key) => {
        pino.info({
          action: 'download.end',
          localpath,
          s3key,
        })
      })
    },
    // used to download the users.json file
    fileDownload: (localFile, remoteFile, done) => {
      s3fs.readFile(remoteFile, 'utf8', (err, contents) => {
        if(err) return done(err)
        fs.writeFile(localFile, contents, 'utf8', done)
      })
    },
    statFile: (remoteFile, done) => {
      s3fs.stat(remoteFile, (err, stat) => {
        if(err) return done()
        done(null, stat ? true : false)
      })
    },
    createFolder: (remoteFolder, done) => {
      s3fs.mkdirp(remoteFolder, done)
    },
    deleteFolder: (remoteFolder, done) => {
      async.series([
        next => s3fs.rmdirp(remoteFolder, next),
        next => s3fs.rmdir(remoteFolder, next),
      ], done)
    },
    writeFile: (remoteFile, contents, done) => {
      s3fs.writeFile(remoteFile, contents, 'utf8', done)
    },
    readFile: (remoteFile, done) => {
      s3fs.readFile(remoteFile, 'utf8', done)
    },
    createBucket: (done) => {
      s3fs.create({}, done)
    },
    bucketNames: aws.s3BucketNames,
    bucketExists: (done) => {
      aws.s3BucketNames((err, buckets) => {
        if(err) return done(err)
        const exists = buckets.filter(b => b == name).length > 0
        done(null, exists)
      })
    }
  }
}

module.exports = S3Factory
