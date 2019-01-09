/*

  the settings passed in via the command line or environment
  
*/
const args = require('minimist')(process.argv, {
  alias: {
    'sextant-manual-init': 'sextantManualInit',
    'sextant-state': 'sextantState',
    'initial-user': 'initialUser',
    'initial-password': 'initialPassword',
  },
  default:{
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || '/api/v1',

    // folder locations
    fileStoreFolder: process.env.SEXTANT_FILE_STORE_FOLDER || '/var/lib/sextant-api/filestore',

    // aws
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsS3BucketRegion: process.env.AWS_S3_BUCKET_REGION || 'us-east-1',

    // sextant initial user and bucket state

    // are we displaying a user form to enter the name of the S3 bucket
    // and initial root user?  Or are we expecting there to be the following
    // values to create the user and password with?
    sextantManualInit: process.env.SEXTANT_MANUAL_INIT,

    // the name of the S3 bucket to automatically create if we are not in
    // SEXTANT_MANUAL_INIT mode
    sextantState: process.env.SEXTANT_STATE,

    // the name of the initial user to create if we are not in
    // SEXTANT_MANUAL_INIT mode
    initialUser: process.env.INITIAL_USER,

    // the name of the initial user to create if we are not in
    // SEXTANT_MANUAL_INIT mode
    initialPassword: process.env.INITIAL_PASSWORD,

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
      'sawtooth/1.0.5/config-maps.yaml',
      'sawtooth/1.0.5/storage-class.yaml',
      'sawtooth/1.0.5/monitoring.yaml',
      //'sawtooth/rbac-main.yaml',
      'sawtooth/1.0.5/validators.yaml',
    ],
  }
})

module.exports = args