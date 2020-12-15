const asyncHandler = require('express-async-handler')
const bodyParser = require('body-parser')
const pino = require('pino')({
  name: 'app',
})
const rbac = require('../rbac')
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const ConfigRoutes = require('./config')
const UserRoutes = require('./user')
const ClusterRoutes = require('./cluster')
const DeploymentRoutes = require('./deployment')
const DamlRoutes = require('./daml')
const TaekionRoutes = require('./taekion')
const AdministrationRoutes = require('./administration')

// middleware function looks for '?mode=<background or foreground>' on incoming requests
const ignoreBackgroundRequests = (req) => {
  if (req.query.mode !== 'background') {
    // update session expiration by maxAge
    req.session._garbage = Date()
    req.session.touch()
  }
  // if req.query.mode === 'background do nothing
}

const RbacMiddleware = (settings) => (store, resource_type, method) => async (req, res, next) => {
  try {
    const canAccess = await rbac(store, req.user, {
      resource_type,
      resource_id: req.params.id,
      method,
      cluster_id: parseInt(req.params.cluster, 10),
    })

    if (canAccess) {
      ignoreBackgroundRequests(req)
      next()
    } else {
      res.status(403)
      res.json({
        error: 'Error: access denied',
        // Is there an active session for the user associated with this request?
        // If not, the user should be logged out in the UI
        reset: !req.user,
      })
    }
  } catch (err) {
    if (settings.logging) {
      pino.error({
        action: 'error',
        error: err.error ? err.error.toString() : err.toString(),
        stack: err.stack,
      })
    }
    next(err)
  }
}

// eslint-disable-next-line consistent-return
const requireUser = (req, res, next) => {
  if (!req.user) {
    res._code = 403
    return next('not logged in')
  }
  next()
}

const Routes = ({
  app,
  controllers,
  settings,
  store,
}) => {
  const rbacMiddleware = RbacMiddleware(settings)
  const basePath = (path) => `${settings.baseUrl}${path}`

  const config = ConfigRoutes(controllers)
  const user = UserRoutes(controllers)
  const cluster = ClusterRoutes(controllers)
  const deployment = DeploymentRoutes(controllers)
  const daml = DamlRoutes(controllers)
  const taekion = TaekionRoutes(controllers)
  const administration = AdministrationRoutes(controllers)

  const options = {
    swaggerDefinition: {
      // Like the one described here: https://swagger.io/specification/#infoObject
      info: {
        title: 'Sextant API',
        version: '2.1.0',
        description: 'Sextant API',
      },
      basePath: '/api/v1'
    },
    // List of files to be processes. You can also set globs './routes/*.js'
    apis: ['/app/api/src/router/index.js', '/app/api/src/router/definitions.yaml'],
  };

  const specs = swaggerJsdoc(options);
  app.use(basePath('/api-docs'), swaggerUi.serve, swaggerUi.setup(specs));

  // this goes here because we don't want to enforce JSON body parsing
  // (because it's a proxy)
  app.use(basePath('/clusters/:cluster/deployments/:id/taekion/rest_api'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(taekion.restApiProxy))

  app.use(bodyParser.json())

  /**
   * @swagger
   *  /config/values:
   *    description:
   *    get:
   *      description: return the ui configuration data
   *      security:
   *        - bearerAuth: []
   *      parameters: []
   *      responses:
   *        default:
   *          description: return the ui configuration data
   */
  app.get(basePath('/config/values'), requireUser, asyncHandler(config.values))

  /**
   * @swagger
   *  /administrative/startTime:
   *    description:
   *    get:
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/administration/startTime'), rbacMiddleware(store, 'administration', 'startTime'), asyncHandler(administration.startTime))

  /**
   * @swagger
   *  /administration/restart:
   *    description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/administration/restart'), rbacMiddleware(store, 'administration', 'restart'), asyncHandler(administration.restart))

  /**
   * @swagger
   *  /user/status:
   *    description:
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user/status'), asyncHandler(user.status))

  /**
   * @swagger
   *  /user/hasInitialUser:
   *    description:
   *    get:
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user/hasInitialUser'), asyncHandler(user.hasInitialUser))
  app.post(basePath('/user/login'), asyncHandler(user.login))

  /**
   * @swagger
   *  /user/logout:
   *    description: logs out the currently logged out user
   *    get:
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user/logout'), requireUser, asyncHandler(user.logout))

  /**
   * @swagger
   *  /user:
   *    description:
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user'), rbacMiddleware(store, 'user', 'list'), asyncHandler(user.list))
  app.post(basePath('/user'), rbacMiddleware(store, 'user', 'create'), asyncHandler(user.create))

  /**
   * @swagger
   *  /user/search:
   *    description:
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user/search'), requireUser, asyncHandler(user.search))

  /**
   * @swagger
   *  /user/{user}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/userParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    put:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user/:id'), rbacMiddleware(store, 'user', 'get'), asyncHandler(user.get))
  app.put(basePath('/user/:id'), rbacMiddleware(store, 'user', 'update'), asyncHandler(user.update))
  app.delete(basePath('/user/:id'), rbacMiddleware(store, 'user', 'delete'), asyncHandler(user.delete))

  /**
   * @swagger
   *  /user/{id}/token:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/userParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    put:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/user/:id/token'), rbacMiddleware(store, 'user', 'token'), asyncHandler(user.getToken))
  app.put(basePath('/user/:id/token'), rbacMiddleware(store, 'user', 'token'), asyncHandler(user.updateToken))

  /**
   * @swagger
   *  /clusters:
   *    description:
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters'), rbacMiddleware(store, 'cluster', 'list'), asyncHandler(cluster.list))
  app.post(basePath('/clusters'), rbacMiddleware(store, 'cluster', 'create'), asyncHandler(cluster.create))

  /**
   * @swagger
   *  /clusters/{cluster}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    put:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.get))
  app.put(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'update'), asyncHandler(cluster.update))
  app.delete(basePath('/clusters/:id'), rbacMiddleware(store, 'cluster', 'delete'), asyncHandler(cluster.delete))

  /**
   * @swagger
   *  /clusters/{cluster}/roles:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:id/roles'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.listRoles))
  app.post(basePath('/clusters/:id/roles'), rbacMiddleware(store, 'cluster', 'updateRole'), asyncHandler(cluster.createRole))

  /**
   * @swagger
   *  /clusters/{cluster}/roles/{user}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/userParam'
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.delete(basePath('/clusters/:id/roles/:userid'), rbacMiddleware(store, 'cluster', 'updateRole'), asyncHandler(cluster.deleteRole))

  /**
   * @swagger
   *  /clusters/{cluster}/tasks:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:id/tasks'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.listTasks))

  /**
   * @swagger
   *  /clusters/{cluster}/resources:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:id/resources'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.resources))

  /**
   * @swagger
   *  /clusters/{cluster}/summary:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:id/summary'), rbacMiddleware(store, 'cluster', 'get'), asyncHandler(cluster.summary))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments'), rbacMiddleware(store, 'deployment', 'list'), asyncHandler(deployment.list))
  app.post(basePath('/clusters/:cluster/deployments'), rbacMiddleware(store, 'deployment', 'create'), asyncHandler(deployment.create))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    put:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.get))
  app.put(basePath('/clusters/:cluster/deployments/:id'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(deployment.update))
  app.delete(basePath('/clusters/:cluster/deployments/:id'), rbacMiddleware(store, 'deployment', 'delete'), asyncHandler(deployment.delete))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/roles:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/roles'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.listRoles))
  app.post(basePath('/clusters/:cluster/deployments/:id/roles'), rbacMiddleware(store, 'deployment', 'updateRole'), asyncHandler(deployment.createRole))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/roles/{user}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *      - $ref: '#/parameters/userParam'
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
  */
  app.delete(basePath('/clusters/:cluster/deployments/:id/roles/:userid'), rbacMiddleware(store, 'deployment', 'updateRole'), asyncHandler(deployment.deleteRole))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/tasks:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/tasks'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.listTasks))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/resources:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/resources'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.resources))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/summary:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/summary'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(deployment.summary))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/keyManagerKeys:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/keyManagerKeys'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(daml.getKeyManagerKeys))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/enrolledKeys:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/enrolledKeys'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(daml.getEnrolledKeys))
  app.post(basePath('/clusters/:cluster/deployments/:id/enrolledKeys'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.addEnrolledKey))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/keyManagerKeys:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/participants'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(daml.getParticipants))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/keyManagerKeys:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/archives'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(daml.getArchives))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/timeServiceInfo:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/timeServiceInfo'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(daml.getTimeServiceInfo))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/registerParticipant:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/clusters/:cluster/deployments/:id/registerParticipant'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.registerParticipant))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/rotateKeys:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/clusters/:cluster/deployments/:id/rotateKeys'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.rotateParticipantKey))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/addParty:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/clusters/:cluster/deployments/:id/addParty'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.addParty))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/removeParties:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/clusters/:cluster/deployments/:id/removeParties'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.removeParties))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/generatePartyToken:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/clusters/:cluster/deployments/:id/generatePartyToken'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.generatePartyToken))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/uploadArchive:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.post(basePath('/clusters/:cluster/deployments/:id/uploadArchive'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(daml.uploadArchive))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/taekion/keys:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/taekion/keys'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(taekion.listKeys))
  app.post(basePath('/clusters/:cluster/deployments/:id/taekion/keys'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.createKey))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/taekion/keys/{keyId}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.delete(basePath('/clusters/:cluster/deployments/:id/taekion/keys/:keyId'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.deleteKey))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/taekion/volumes:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/taekion/volumes'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(taekion.listVolumes))
  app.post(basePath('/clusters/:cluster/deployments/:id/taekion/volumes'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.createVolume))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *      - $ref: '#/parameters/volumeParam'
   *    put:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.put(basePath('/clusters/:cluster/deployments/:id/taekion/volumes/:volume'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.updateVolume))
  app.delete(basePath('/clusters/:cluster/deployments/:id/taekion/volumes/:volume'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.deleteVolume))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}/snapshots:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *      - $ref: '#/parameters/volumeParam'
   *    get:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   *    post:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.get(basePath('/clusters/:cluster/deployments/:id/taekion/volumes/:volume/snapshots'), rbacMiddleware(store, 'deployment', 'get'), asyncHandler(taekion.listSnapshots))
  app.post(basePath('/clusters/:cluster/deployments/:id/taekion/volumes/:volume/snapshots'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.createSnapshot))

  /**
   * @swagger
   *  /clusters/{cluster}/deployments/{deployment}/taekion/volumes/{volume}/snapshots/{snapshot}:
   *    description:
   *    parameters:
   *      - $ref: '#/parameters/clusterParam'
   *      - $ref: '#/parameters/deploymentParam'
   *      - $ref: '#/parameters/volumeParam'
   *      - $ref: '#/parameters/snapshotParam'
   *    delete:
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        default:
   *          description:
   */
  app.delete(basePath('/clusters/:cluster/deployments/:id/taekion/volumes/:volume/snapshots/:snapshotName'), rbacMiddleware(store, 'deployment', 'update'), asyncHandler(taekion.deleteSnapshot))
}

module.exports = Routes
