const ConfigRoutes = (controllers) => {

  const values = (req, res, next) => {

    controllers.config.values({}, (err, result) => {
      res
        .status(200)
        .json(result)
    })
  }

  return {
    values,
  }
}

module.exports = ConfigRoutes