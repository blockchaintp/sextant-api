const async = require('async')
const pino = require('pino')({
  name: 'worker.createCluster',
})

const kops = require('../../utils/kops')

/*

  create a new kops cluster given the cluster settings

  params:

    {
      domain: "dev.catenasys.com.",
      master_count: 1,
      master_size: "m1.medium",
      master_zones: ["eu-west-2a"],
      name: "apples",
      node_count: 3,
      node_size: "m1.medium",
      node_zones: ["eu-west-2a"],
      region: "eu-west-2",
      topology: "public",
      public_key: "XXX",
    }

  it will put the cluster into "error" state if there is any kind of error
  loading the cluster

  example commands:

  kops create cluster apples.dev.catenasys.com \
    --node-count 3 \
    --zones eu-west-2a \
    --node-size m4.large \
    --master-count 1 \
    --master-size m4.large \
    --master-zones eu-west-2a \
    --networking weave \
    --state s3://clusters.dev.catenasys.com \
    --topology public \
    --yes

  kops create secret --name apples.dev.catenasys.com \
    --state s3://clusters.dev.catenasys.com  \
    sshpublickey admin -i /filestore-data/clusters/apples/id_rsa.pub

  kops update cluster apples.dev.catenasys.com --yes \
    --state s3://clusters.dev.catenasys.com

  kops validate cluster --name apples.dev.catenasys.com \
     --state s3://clusters.dev.catenasys.com

  kops delete cluster apples.dev.catenasys.com \
    --state s3://clusters.dev.catenasys.com --yes
  
*/

const CreateKopsCluster = (params, store, dispatcher) => {
  pino.info({
    action: 'handle',
    params,
  })

  async.waterfall([

    // load the path to the public key file
    (nextw) => {
      store.getClusterFilePath({
        clustername: params.name,
        filename: 'publicKey'
      }, nextw)
    },

    (publicKeyPath, nextw) => {
      async.series([

        // call the create cluster command
        nexts => kops.createCluster(params, publicKeyPath, nexts),

        // create the cluster secret
        nexts => kops.createSecret(params, publicKeyPath, nexts),

        // update the cluster
        nexts => kops.updateCluster(params, nexts),

      ], nextw)
    },
    
  ], (err) => {
    if(err) {

      pino.error({
        action: 'error',
        params,
        error: err,
      })

      // if there has been an error in creating the cluster - tell the store
      // to put the cluster into an error state
      store.setClusterError({
        clustername: params.name,
        error: err.toString()
      }, () => {})
    }
    else {

      pino.info({
        action: 'success',
        params,
      })

      // the cluster has been created, trigger a waitClusterCreated job
      // that will loop until the cluster is validated
      dispatcher({
        name: 'waitClusterCreated',
        params,
      }, () => {})
    }
  })
}

module.exports = CreateKopsCluster