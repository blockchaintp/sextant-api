import { Controller } from '../controller'
import { Request, Response } from 'express'

export const AdministrationRoutes = (controllers: Controller) => {
  const restart = (req: Request, res: Response) => {
    const data = controllers.administration.restart()
    res.status(200).json(data)
  }

  const startTime = (req: Request, res: Response) => {
    const data = controllers.administration.startTime()
    res.status(200).json(data)
  }

  return {
    restart,
    startTime,
  }
}
