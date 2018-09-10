const fs = require('fs')

const ClusterRoutes = (backends) => {

  const { cluster } = backends

  const list = (req, res, next) => {
    cluster.list({}, (err, clusters) => {
      if(err) return next(err)
      res
        .status(200)
        .json(clusters)
    })
  }

  const get = (req, res, next) => {
    cluster.get({
      name: req.params.id,
    }, (err, cluster) => {
      if(err) return next(err)
      res
        .status(200)
        .json(cluster)
    })
  }

  const status = (req, res, next) => {
    cluster.status({
      name: req.params.id,
    }, (err, status) => {
      if(err) return next(err)
      res
        .status(200)
        .json(status)
    })
  }

  const create = (req, res, next) => {
    cluster.create(req.body, (err, results) => {
      if(err) return next(err)
      res
        .status(201)
        .json(results)
    })
  }

  const createKeypair = (req, res, next) => {
    cluster.createKeypair({}, (err, results) => {
      if(err) return next(err)
      res
        .status(200)
        .json(results)
    })
  }

  const destroy = (req, res, next) => {
    cluster.destroy({
      name: req.params.id,
    }, (err) => {
      if(err) return next(err)

      res
        .status(200)
        .json({
          ok: true
        })
    })
  }

  const cleanup = (req, res, next) => {
    cluster.cleanup({
      name: req.params.id,
    }, (err) => {
      if(err) return next(err)
      res
        .status(200)
        .json({
          ok: true
        })
    })
  }

  const kubeconfig = (req, res, next) => {
    cluster.getClusterFilepath({
      name: req.params.id,
      filename: 'kubeConfig',
    }, (err, filepath) => {
      if(err) return next(err)

      res.setHeader('Content-disposition', `attachment; filename=${req.params.id}-kubeconfig`)
      res.setHeader('Content-type', 'text/plain')

      fs
        .createReadStream(filepath)
        .pipe(res)
    })
  }


  const kopsconfig = (req, res, next) => {
    cluster.getClusterFilepath({
      name: req.params.id,
      filename: 'kopsConfig',
    }, (err, filepath) => {
      if(err) return next(err)

      res.setHeader('Content-disposition', `attachment; filename=${req.params.id}-kopsconfig.yaml`)
      res.setHeader('Content-type', 'text/yaml')

      fs
        .createReadStream(filepath)
        .pipe(res)
    })
  }

  const deploy = (req, res, next) => {
    cluster.deploy({
      name: req.params.id,
    }, (err) => {
      if(err) return next(err)
      res
        .status(200)
        .json({
          ok: true
        })
    })
  }

  const test = (req, res, next) => {
    cluster.test({
      name: req.params.id,
    }, (err, data) => {
      if(err) return next(err)
      res
        .status(200)
        .json(data)
    })
  }

  return {
    list,
    get,
    status,
    create,
    destroy,
    cleanup,
    createKeypair,
    kubeconfig,
    kopsconfig,
    deploy,
    test,
  }
}

module.exports = ClusterRoutes