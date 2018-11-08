const S3FS = require('s3fs')
const settings = require('../settings')
/*

  const fs = new S3FS(settings.filestoreS3BucketName, {
    region: settings.filestoreS3BucketRegion,
    credentials: {
      accessKeyId: settings.awsAccessKeyId,
      secretAccessKey: settings.awsSecretAccessKey,
    }
  })
  
*/
const s3fsFactory = () => {
  return {
    fs,
  }
}

module.exports = s3fsFactory