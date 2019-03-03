const userUtils = require('../utils/user')

const UserRoutes = (controllers) => {

  const status = (req, res, next) => {
    controllers.user.count({}, (err, userCount) => {
      if(err) return next(err)
      res
        .status(200)
        .json({
          count: userCount,
          data: req.user,
        })
    })
  }

  const login = (req, res, next) => {
    const { username, password } = req.body

    controllers.user.checkPassword({
      username,
      password,
    }, (err, ok) => {
      if(err) return next(err)
      if(!ok) {
        res.status(403)
        res.json({
          error: `incorrect login details`
        })
      }
      else {

        controllers.user.get({
          username,
        }, (err, user) => {
          if(err) return next(err)
          req.login(userUtils.safe(user), (err) => {
            if(err) return next(err)
            res.status(200)
            res.json({
              ok: true,
            })
          })
        })
      }
    })
  }

  const logout = (req, res, next) => {
    req.logout()
    res
      .status(200)
      .json({
        ok: true,
      })
  }

  const list = (req, res, next) => {
    controllers.user.list({}, (err, users) => {
      if(err) return next(err)
      users = users.map(userUtils.safe)
      res
        .status(200)
        .json(users)
    })
  }

  const get = (req, res, next) => {
    controllers.user.get({
      username: req.params.username,
    }, (err, user) => {
      if(err) return next(err)
      res
        .status(200)
        .json(userUtils.safe(user))
    })
  }

  const update = (req, res, next) => {
    controllers.user.update({
      existingUsername: req.params.username,
      username: req.body.username,
      type: req.body.type,
      password: req.body.password,
    }, (err, user) => {
      if(err) return next(err)
      res
        .status(200)
        .json({
          ok: true,
        })
    })
  }

  const create = (req, res, next) => {
    controllers.user.add(req.body, (err) => {
      if(err) return next(err)
      res
        .status(201)
        .json({
          ok: true,
        })
    })
  }

  const del = (req, res, next) => {
    controllers.user.del({
      username: req.params.username,
    }, (err) => {
      if(err) return next(err)
      res
        .status(200)
        .json({
          ok: true,
        })
    })
  }

  return {
    status,
    login,
    logout,
    list,
    get,
    update,
    create,
    del,
  }
}

module.exports = UserRoutes