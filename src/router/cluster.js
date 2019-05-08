const ClusterRoutes = (controllers) => {

  const list = async (req, res, next) => {
    const data = await controllers.cluster.list({
      user: req.user,
      deleted: req.query.showDeleted == 'y',
    })
    res.json(data)
  }

  const get = async (req, res, next) => {
    const data = await controllers.cluster.get({
      id: req.params.id,
    })
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
  }

  const create = async (req, res, next) => {
    const data = await controllers.cluster.create({
      user: req.user,
      data: req.body,
    })
    res
      .status(201)
      .json(data)
  }

  const update = async (req, res, next) => {
    const data = await controllers.cluster.update({
      id: req.params.id,
      user: req.user,
      data: req.body,
    })
    res
      .status(200)
      .json(data)
  }

  const del = async (req, res, next) => {
    const data = await controllers.cluster.delete({
      id: req.params.id,
      user: req.user,
    })
    res
      .status(200)
      .json(data)
  }

  const listRoles = async (req, res, next) => {
    const data = await controllers.cluster.getRoles({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const createRole = async (req, res, next) => {
    const data = await controllers.cluster.createRole({
      id: req.params.id,
      user: req.body.user,
      permission: req.body.permission,
    })
    res
      .status(201)
      .json(data)
  }

  const deleteRole = async (req, res, next) => {
    const data = await controllers.cluster.deleteRole({
      id: req.params.id,
      user: req.params.userid,
    })
    res
      .status(200)
      .json(data)
  }

  const listTasks = async (req, res, next) => {
    const data = await controllers.cluster.getTasks({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
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