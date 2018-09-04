const ConfigRoutes = (backends) => {

  const { config } = backends

  const version = (req, res, next) => {

    config.version({}, (err, version) => {
      res
        .status(200)
        .json({
          version
        })
    })
  }

  const values = (req, res, next) => {

    config.values({}, (err, result) => {
      res
        .status(200)
        .json(result)
    })
  }

  const aws = (req, res, next) => {

    config.aws({}, (err, result) => {
      res
        .status(200)
        .json(result)
    })
  }

  return {
    version,
    values,
    aws,
  }
}

module.exports = ConfigRoutes