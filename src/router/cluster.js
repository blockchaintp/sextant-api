const ClusterRoutes = (controllers) => {

  const list = (req, res, next) => {
    controllers.cluster.list({
      user: req.user,
    }, (err, data) => {
      if(err) return next(err)
      res.json(data)
    })
  }

  const create = (req, res, next) => {
    controllers.cluster.create({
      user: req.user,
      data: req.body,
    }, (err, data) => {
      if(err) return next(err)
      res
        .status(201)
        .json(data)
    })
  }

  return {
    list,
    create,
  }
}

module.exports = ClusterRoutes