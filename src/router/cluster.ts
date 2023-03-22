import { NextFunction, Request, Response } from 'express'
import { CLUSTER_STATUS } from '../config'
import { Controller } from '../controller'
import { User } from '../store/model/model-types'

type RequestWithUser = Request & { user: User }

export const ClusterRoutes = (controllers: Controller) => {
  const list = async (req: RequestWithUser, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.list({
      user: req.user,
      deleted: <boolean>(req.query.showDeleted as unknown),
      withTasks: <boolean>(req.query.withTasks as unknown),
    })
    res.json(data)
  }

  const get = async (req: Request, res: Response, _next: NextFunction) => {
    const id = Number.parseInt(req.params.id)
    const withTask = <boolean>(req.query.withTasks as unknown)
    const data = await controllers.cluster.get({
      id,
      withTask,
    })
    if (!data) {
      res.status(404).json({
        error: `no cluster found with id: ${req.params.id}`,
      })
    } else {
      res.json(data)
    }
  }

  const create = async (req: RequestWithUser, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.create({
      user: req.user,
      data: req.body,
    })
    res.status(201).json(data)
  }

  const update = async (req: RequestWithUser, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.update({
      id: Number.parseInt(req.params.id),
      user: req.user,
      data: req.body,
    })
    res.status(200).json(data)
  }

  const del = async (req: RequestWithUser, res: Response, _next: NextFunction) => {
    const cluster = await controllers.cluster.get({
      id: Number.parseInt(req.params.id),
    })

    let data = null

    if (cluster.status == CLUSTER_STATUS.deleted) {
      data = await controllers.cluster.deletePermanently({
        id: Number.parseInt(req.params.id),
      })
    } else {
      data = await controllers.cluster.delete({
        id: Number.parseInt(req.params.id),
        user: req.user,
      })
    }

    res.status(200).json(data)
  }

  const listRoles = async (req: Request, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.getRoles({
      id: Number.parseInt(req.params.id),
    })
    res.status(200).json(data)
  }

  const createRole = async (req: Request, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.createRole({
      id: Number.parseInt(req.params.id),
      user: req.body.user,
      username: req.body.username,
      permission: req.body.permission,
    })
    res.status(201).json(data)
  }

  const deleteRole = async (req: Request, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.deleteRole({
      id: Number.parseInt(req.params.id),
      user: Number.parseInt(req.params.userid),
    })
    res.status(200).json(data)
  }

  const listTasks = async (req: Request, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.getTasks({
      id: Number.parseInt(req.params.id),
    })
    res.status(200).json(data)
  }

  const resources = async (req: Request, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.resources({
      id: Number.parseInt(req.params.id),
    })
    res.status(200).json(data)
  }

  const summary = async (req: Request, res: Response, _next: NextFunction) => {
    const data = await controllers.cluster.summary({
      id: Number.parseInt(req.params.id),
    })
    res.status(200).json(data)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    listRoles,
    createRole,
    deleteRole,
    listTasks,
    resources,
    summary,
  }
}
