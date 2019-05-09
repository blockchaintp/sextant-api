const config = require('../config')

const {
  CLUSTER_STATUS,
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

  return {
    list,
    get,
  }
}

module.exports = DeploymentRoutes