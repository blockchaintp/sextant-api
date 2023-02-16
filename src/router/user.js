/* eslint-disable consistent-return */
const userUtils = require('../utils/user')

const UserRoutes = (controllers) => {
  const status = async (req, res) => {
    const result = req.user ? userUtils.safe(req.user) : null

    if (result) {
      const roles = await controllers.user.getRoles({
        id: result.id,
      })

      result.roles = roles
    }

    res.status(200).json(result)
  }

  const hasInitialUser = async (req, res) => {
    const userCount = await controllers.user.count({})
    res.status(200).json(userCount > 0)
  }

  const login = async (req, res) => {
    const { username, password } = req.body

    const ok = await controllers.user.checkPassword({
      username,
      password,
    })

    if (!ok) {
      res.status(403)
      res.json({
        error: 'incorrect login details',
      })
      return
    }

    const user = await controllers.user.get({
      username,
    })

    await new Promise((resolve, reject) => {
      req.login(userUtils.safe(user), (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
    res.status(200)
    res.json({
      ok: true,
    })
  }

  const logout = (req, res) => {
    req.logout((err) => {
      if (err) {
        res.status(500).json({
          ok: false,
          err,
        })
      } else {
        res.status(200).json({
          ok: true,
        })
      }
    })
  }

  const list = async (req, res) => {
    const users = await controllers.user.list()
    res.status(200).json(users.map(userUtils.safe))
  }

  const search = async (req, res) => {
    const users = await controllers.user.search({
      search: req.query.search,
    })
    res.status(200).json(users)
  }

  const get = async (req, res) => {
    const user = await controllers.user.get({
      id: req.params.id,
    })
    res.status(200).json(userUtils.safe(user))
  }

  const update = async (req, res, next) => {
    // we have already done rbac but we need to check
    // a  user is not changing their own role
    // this is to prevent:
    //
    //  * an superuser user locking themselves out of the system (by downgrading)
    //  * a normal user giving themselves superuser access
    // eslint-disable-next-line eqeqeq
    if (req.user.id == req.params.id && req.body.permission && req.body.permission !== req.user.permission) {
      res._code = 403
      return next('cannot change own permission')
    }

    // a user cannot attempt to update tokens using the normal update method
    // otherwise we might get broken tokens
    if (req.body.server_side_key) {
      res._code = 403
      return next('cannot change server_side_key via update')
    }

    const user = await controllers.user.update({
      id: req.params.id,
      data: req.body,
    })

    res.status(200).json(userUtils.safe(user))
  }

  const getToken = async (req, res) => {
    const token = await controllers.user.getToken({
      id: req.params.id,
    })
    res.status(200).json({
      token,
    })
  }

  const updateToken = async (req, res) => {
    await controllers.user.updateToken({
      id: req.params.id,
    })
    res.status(201).json({
      ok: true,
    })
  }

  const create = async (req, res) => {
    const user = await controllers.user.create(req.body)
    res.status(201).json(userUtils.safe(user))
  }

  const del = async (req, res, next) => {
    // make sure a user cannot delete themselves
    // eslint-disable-next-line eqeqeq
    if (req.user.id == req.params.id) {
      res._code = 403
      return next('cannot delete yourself')
    }

    await controllers.user.delete({
      id: req.params.id,
    })

    res.status(200).json({
      ok: true,
    })
  }

  return {
    status,
    hasInitialUser,
    login,
    logout,
    list,
    search,
    get,
    update,
    getToken,
    updateToken,
    create,
    delete: del,
  }
}

module.exports = UserRoutes
