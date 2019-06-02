const config = require('../config')

const {
  DEPLOYMENT_STATUS,
} = config

const DeploymentRoutes = (controllers) => {

  const list = async (req, res, next) => {
    const data = await controllers.deployment.list({
      user: req.user,
      cluster: req.params.cluster,
      deleted: req.query.showDeleted,
      withTasks: req.query.withTasks,
    })
    res.json(data)
  }

  const get = async (req, res, next) => {
    const data = await controllers.deployment.get({
      id: req.params.id,
      withTask: req.query.withTasks,
    })
    if(!data) {
      res
        .status(404)
        .json({
          error: `no deployment found with id: ${req.params.id}`,
        })
    }
    else {
      res.json(data)
    }
  }

  const create = async (req, res, next) => {
    const data = await controllers.deployment.create({
      user: req.user,
      cluster: req.params.cluster,
      data: req.body,
    })
    res
      .status(201)
      .json(data)
  }

  const update = async (req, res, next) => {
    const data = await controllers.deployment.update({
      id: req.params.id,
      user: req.user,
      data: req.body,
    })
    res
      .status(200)
      .json(data)
  }

  const listTasks = async (req, res, next) => {
    const data = await controllers.deployment.getTasks({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const listRoles = async (req, res, next) => {
    const data = await controllers.deployment.getRoles({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const createRole = async (req, res, next) => {
    const data = await controllers.deployment.createRole({
      id: req.params.id,
      user: req.body.user,
      username: req.body.username,
      permission: req.body.permission,
    })
    res
      .status(201)
      .json(data)
  }

  const deleteRole = async (req, res, next) => {
    const data = await controllers.deployment.deleteRole({
      id: req.params.id,
      user: req.params.userid,
    })
    res
      .status(200)
      .json(data)
  }

  const resources = async (req, res, next) => {
    const data = await controllers.deployment.resources({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const summary = async (req, res, next) => {
    const data = await controllers.deployment.summary({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const del = async (req, res, next) => {

    const deployment = await controllers.deployment.get({
      id: req.params.id,
    })

    let data = null

    if(deployment.status == DEPLOYMENT_STATUS.deleted) {
      data = await controllers.deployment.deletePermenantly({
        id: req.params.id,
        user: req.user,
      })
    }
    else {
      data = await controllers.deployment.delete({
        id: req.params.id,
        user: req.user,
      })
    }
    
    res
      .status(200)
      .json(data)
  }

  return {
    list,
    get,
    create,
    update,
    listRoles,
    createRole,
    deleteRole,
    listTasks,
    resources,
    summary,
    delete: del,
  }
}

module.exports = DeploymentRoutes