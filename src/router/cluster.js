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

  const listRoles = (req, res, next) => {
    controllers.cluster.getRoles({
      id: req.params.id,
    }, (err, data) => {
      if(err) return next(err)
      res
        .json(data)
    })
  }

  const createRole = (req, res, next) => {
    controllers.cluster.createRole({
      id: req.params.id,
      user: req.body.user,
      permission: req.body.permission,
    }, (err, data) => {
      if(err) return next(err)
      res
        .status(201)
        .json(data)
    })
  }

  const deleteRole = (req, res, next) => {
    controllers.cluster.deleteRole({
      id: req.params.id,
      user: req.params.userid,
    }, (err, data) => {
      if(err) return next(err)
      res
        .status(200)
        .json(data)
    })
  }

  return {
    list,
    create,
    listRoles,
    createRole,
    deleteRole,
  }
}

module.exports = ClusterRoutes