/*

  the settings passed in via the command line or environment
  
*/
const args = require('minimist')(process.argv, {
  default:{
    port: process.env.PORT || 80,
    baseUrl: process.env.BASE_URL || '/api/v1',
    fileStoreFolder: process.env.SEXTANT_FILE_STORE_FOLDER || '/var/lib/sextant-api/filestore',

    // which type of networking we use for kops clusters
    kopsNetworking: 'weave',
    
    // when creating a cluster - try 100 times waiting 10 seconds between each try
    validateClusterAttempts: 100,
    validateClusterDelay: 10000,

    // core manifests
    dashboardManifest: 'https://raw.githubusercontent.com/kubernetes/kops/master/addons/kubernetes-dashboard/v1.8.3.yaml',

    route53MapperManifest: 'https://raw.githubusercontent.com/kubernetes/kops/master/addons/route53-mapper/v1.3.0.yml',
  }
})

module.exports = args