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

  const setupRemote = (req, res, next) => {
    config.setupRemote(req.body, (err, result) => {
      if(err) return next(err)
      res
        .status(201)
        .json(result)
    })
  }

  return {
    version,
    values,
    aws,
    setupRemote,
  }
}

module.exports = ConfigRoutes