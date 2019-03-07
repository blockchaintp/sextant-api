const userUtils = require('../utils/user')

const UserRoutes = (controllers) => {

  const status = (req, res, next) => {
    const result = req.user ?
      userUtils.safe(req.user) :
      null
    res
      .status(200)
      .json(result)
  }

  const hasInitialUser = (req, res, next) => {
    controllers.user.count({}, (err, userCount) => {
      if(err) return next(err)
      res
        .status(200)
        .json(userCount > 0 ? true : false)
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
      id: req.params.id,
    }, (err, user) => {
      if(err) return next(err)

      const safeData = userUtils.safe(user)

      // if the user is the same as the logged in user
      // include the token (so they can see it)
      if(req.params.id == req.user.id) {
        safeData.token = user.token
      }
      
      res
        .status(200)
        .json(safeData)
    })
  }

  const update = (req, res, next) => {

    // we have already done rbac but we need to check
    // a  user is not changing their own role
    // this is to prevent:
    //
    //  * an admin user locking themselves out of the system (by downgrading)
    //  * a normal user giving themselves admin access
    if(req.user.id == req.params.id && req.body.role) {
      res._code = 403
      return next(`cannot change own role`)
    }

    // a user cannot attempt to update tokens using the normal update method
    // otherwise we might get broken tokens
    if(req.body.token || req.body.token_salt) {
      res._code = 403
      return next(`cannot change token via update`)
    }
    
    controllers.user.update({
      id: req.params.id,
      data: req.body,
    }, (err, user) => {
      if(err) return next(err)
      res
        .status(200)
        .json(userUtils.safe(user))
    })
  }

  const updateToken = (req, res, next) => {
    controllers.user.updateToken({
      id: req.params.id,
    }, (err) => {
      if(err) return next(err)
      res
        .status(201)
        .json({
          ok: true,
        })
    })
  }

  const create = (req, res, next) => {
    controllers.user.create(req.body, (err, user) => {
      if(err) return next(err)
      res
        .status(201)
        .json(userUtils.safe(user))
    })
  }

  const del = (req, res, next) => {

    // make sure a user cannot delete themselves
    if(req.user.id == req.params.id) {
      res._code = 403
      return next(`cannot delete yourself`)
    }

    controllers.user.del({
      id: req.params.id,
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
    hasInitialUser,
    login,
    logout,
    list,
    get,
    update,
    updateToken,
    create,
    del,
  }
}

module.exports = UserRoutes