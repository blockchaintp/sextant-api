/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
const config = require('../config')

const {
  CLUSTER_STATUS,
} = config

const ClusterRoutes = (controllers) => {
  const list = async (req, res, _next) => {
    const data = await controllers.cluster.list({
      user: req.user,
      deleted: req.query.showDeleted,
      withTasks: req.query.withTasks,
    })
    res.json(data)
  }

  const get = async (req, res, _next) => {
    const data = await controllers.cluster.get({
      id: req.params.id,
      withTask: req.query.withTasks,
    })
    if (!data) {
      res
        .status(404)
        .json({
          error: `no cluster found with id: ${req.params.id}`,
        })
    } else {
      res.json(data)
    }
  }

  const create = async (req, res, _next) => {
    const data = await controllers.cluster.create({
      user: req.user,
      data: req.body,
    })
    res
      .status(201)
      .json(data)
  }

  const update = async (req, res, _next) => {
    const data = await controllers.cluster.update({
      id: req.params.id,
      user: req.user,
      data: req.body,
    })
    res
      .status(200)
      .json(data)
  }

  const del = async (req, res, _next) => {
    const cluster = await controllers.cluster.get({
      id: req.params.id,
    })

    let data = null

    if (cluster.status == CLUSTER_STATUS.deleted) {
      data = await controllers.cluster.deletePermanently({
        id: req.params.id,
        user: req.user,
      })
    } else {
      data = await controllers.cluster.delete({
        id: req.params.id,
        user: req.user,
      })
    }

    res
      .status(200)
      .json(data)
  }

  const listRoles = async (req, res, _next) => {
    const data = await controllers.cluster.getRoles({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const createRole = async (req, res, _next) => {
    const data = await controllers.cluster.createRole({
      id: req.params.id,
      user: req.body.user,
      username: req.body.username,
      permission: req.body.permission,
    })
    res
      .status(201)
      .json(data)
  }

  const deleteRole = async (req, res, _next) => {
    const data = await controllers.cluster.deleteRole({
      id: req.params.id,
      user: req.params.userid,
    })
    res
      .status(200)
      .json(data)
  }

  const listTasks = async (req, res, _next) => {
    const data = await controllers.cluster.getTasks({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const resources = async (req, res, _next) => {
    const data = await controllers.cluster.resources({
      id: req.params.id,
    })
    res
      .status(200)
      .json(data)
  }

  const summary = async (req, res, _next) => {
    const data = await controllers.cluster.summary({
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
    resources,
    summary,
  }
}

module.exports = ClusterRoutes
