const ClusterRoutes = (backends) => {

  const { cluster } = backends

  const list = (req, res, next) => {
    cluster.list({}, (err, clusters) => {
      if(err) return next(err)
      res
        .status(200)
        .json(clusters)
    })
  }

  const get = (req, res, next) => {
    cluster.get({
      id: req.params.id,
    }, (err, cluster) => {
      if(err) return next(err)
      res
        .status(200)
        .json(cluster)
    })
  }

  const status = (req, res, next) => {
    cluster.status({
      id: req.params.id,
    }, (err, status) => {
      if(err) return next(err)
      res
        .status(200)
        .json(status)
    })
  }

  const create = (req, res, next) => {
    cluster.create(req.body, (err, results) => {
      if(err) return next(err)
      res
        .status(201)
        .json(results)
    })
  }

  const createKeypair = (req, res, next) => {
    cluster.createKeypair({}, (err, results) => {
      if(err) return next(err)
      res
        .status(200)
        .json(results)
    })
  }

  return {
    list,
    get,
    status,
    create,
    createKeypair,
  }
}

module.exports = ClusterRoutes