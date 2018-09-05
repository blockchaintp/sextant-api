/*

  create a new kops cluster given the cluster settings

  params:

    {
      domain: "dev.catenasys.com.",
      master_size: 1,
      master_type: "m1.medium",
      master_zones: ["eu-west-2a"],
      name: "apples",
      node_size: 3,
      node_type: "m1.medium",
      node_zones: ["eu-west-2a"],
      region: "eu-west-2",
      topology: "public",
      public_key: "XXX",
    }

  it will put the cluster into "error" state if there is any kind of error
  loading the cluster
  
*/

const CreateKopsCluster = (params, store, dispatcher) => {
  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('CREATING CLUSTER!!!!!')
  console.dir(params)
  setTimeout(() => {
    dispatcher({
      name: 'waitClusterCreated',
      params: {
        apples: 10
      }
    }, () => {
      console.log('-------------------------------------------');
      console.log('job dispatched')
    })
  }, 2000)
}

module.exports = CreateKopsCluster