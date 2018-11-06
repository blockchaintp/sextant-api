const userUtils = require('../utils/user')

const UserRoutes = (backends) => {

  const { user } = backends

  const status = (req, res, next) => {
    user.count({}, (err, userCount) => {
      if(err) return next(err)
      res
        .status(200)
        .json({
          count: userCount,
          data: req.user,
        })
    })
  }

  const list = (req, res, next) => {
    user.list({}, (err, users) => {
      if(err) return next(err)
      users = users.map(userUtils.safe)
      res
        .status(200)
        .json(users)
    })
  }

  const create = (req, res, next) => {
    user.add(req.body, (err) => {
      if(err) return next(err)
      res
        .status(201)
        .json({
          ok: true,
        })
    })
  }

  return {
    status,
    list,
    create,
  }
}

module.exports = UserRoutes