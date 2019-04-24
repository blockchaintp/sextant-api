const ClusterCreate = (params, done) => {

  const {
    store,
    task,
  } = params
  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.log('--------------------------------------------')
  console.log('create cluster params')
  console.dir(task)
  done()
}

module.exports = ClusterCreate