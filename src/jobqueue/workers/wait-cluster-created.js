/*

  wait for a given kops cluster to have been created
  and update the "status" in the store when it is ready

  params:

    {
      domain: "dev.catenasys.com.",
      name: "apples",
    }

*/

const WaitClusterCreated = (params, store, dispatcher) => {
  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('wait cluster created!!!')
  console.dir(params)
  process.exit()
}

module.exports = WaitClusterCreated