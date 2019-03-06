const ConfigRoutes = (controllers) => {

  const version = (req, res, next) => {

    controllers.config.version({}, (err, version) => {
      res
        .status(200)
        .json({
          version
        })
    })
  }

  const values = (req, res, next) => {

    controllers.config.values({}, (err, result) => {
      res
        .status(200)
        .json(result)
    })
  }

  return {
    version,
    values,
  }
}

module.exports = ConfigRoutes