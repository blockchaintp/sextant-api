/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const ConfigRoutes = (controllers) => {

  const values = async (req, res, next) => {
    const result = await controllers.config.values({})
    res
      .status(200)
      .json(result)
  }

  return {
    values,
  }
}

module.exports = ConfigRoutes
