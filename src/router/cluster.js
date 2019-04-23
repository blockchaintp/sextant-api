const ClusterRoutes = (controllers) => {

  const list = (req, res, next) => {
    controllers.cluster.list({
      user: req.user,
    }, (err, data) => {
      if(err) return next(err)
      res.json(data)
    })
  }

  return {
    list,
  }
}

module.exports = ClusterRoutes