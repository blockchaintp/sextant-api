/*

  the settings passed in via the command line or environment
  
*/
const args = require('minimist')(process.argv, {
  default:{
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || '/api/v1',

    // folder locations
    fileStoreFolder: process.env.SEXTANT_FILE_STORE_FOLDER || '/var/lib/sextant-api/filestore',

    // aws
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsS3BucketRegion: process.env.AWS_S3_BUCKET_REGION || 'us-east-1',

    // sessions
    sessionSecret: process.env.SESSION_SECRET || 'sextant-blockchain',

    // which type of networking we use for kops clusters
    kopsNetworking: 'weave',
    
    // when creating a cluster - try 100 times waiting 10 seconds between each try
    validateClusterAttempts: 100,
    validateClusterDelay: 10000,

    // core manifest urls
    dashboardManifest: 'https://raw.githubusercontent.com/kubernetes/kops/master/addons/kubernetes-dashboard/v1.8.3.yaml',

    // a list of the sawtooth template manifests that will be rendered and applied in order
    sawtoothManifests: [
      'sawtooth/config-maps.yaml',
      'sawtooth/storage-class.yaml',
      'sawtooth/monitoring.yaml',
      'sawtooth/rbac-main.yaml',
      'sawtooth/validators.yaml',
    ],
  }
})

module.exports = args