const ClusterRoutes = (controllers) => {

  const list = (req, res, next) => {
    controllers.cluster.list({
      user: req.user,
      deleted: req.query.showDeleted == 'y',
    }, (err, data) => {
      if(err) return next(err)
      res.json(data)
    })
  }

  const get = (req, res, next) => {
    controllers.cluster.get({
      id: req.params.id,
    }, (err, data) => {
      if(err) return next(err)
      if(!data) {
        res
          .status(404)
          .json({
            error: `no cluster found with id: ${req.params.id}`,
          })
      }
      else {
        res.json(data)
      }
      
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

  const update = (req, res, next) => {
    controllers.cluster.update({
      id: req.params.id,
      user: req.user,
      data: req.body,
    }, (err, data) => {
      if(err) return next(err)
      res
        .status(200)
        .json(data)
    })
  }

  const del = (req, res, next) => {
    controllers.cluster.delete({
      id: req.params.id,
      user: req.user,
    }, (err, data) => {
      if(err) return next(err)
      res
        .status(200)
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

  const listTasks = (req, res, next) => {
    controllers.cluster.getTasks({
      id: req.params.id,
    }, (err, data) => {
      if(err) return next(err)
      res
        .json(data)
    })
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    listRoles,
    createRole,
    deleteRole,
    listTasks,
  }
}

module.exports = ClusterRoutes