const administrationRoutes = (controllers) => {
  const restart = async (req, res) => {
    const data = await controllers.administration.restart({})
    res
      .status(200)
      .json(data)
  }

  const startTime = async (req, res) => {
    const data = await controllers.administration.startTime({})
    res
      .status(200)
      .json(data)
  }

  return {
    restart,
    startTime,
  }
}

module.exports = administrationRoutes
