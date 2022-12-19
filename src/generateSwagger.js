/**
 * Generates a swagger.json file for the api.
 */
const fs = require('fs')
// eslint-disable-next-line import/no-extraneous-dependencies
const widdershins = require('widdershins')
const swaggerJsdoc = require('swagger-jsdoc')

const logger = require('./logging').getLogger({
  name: 'generateSwagger',
})

const options = {
  swaggerDefinition: {
    // Like the one described here: https://swagger.io/specification/#infoObject
    info: {
      title: 'Sextant API',
      version: '2.1.0',
      description: 'Sextant API',
    },
    basePath: '/api/v1',
  },
  // List of files to be processes. You can also set globs './routes/*.js'
  apis: ['src/router/index.js', 'src/router/definitions.yaml'],
}

const specs = swaggerJsdoc(options)

const widdershinsOptions = {
  language_tabs: [{ python: 'Python' }, { ruby: 'Ruby' }],
  omitHeader: true,
}

widdershins
  .convert(specs, widdershinsOptions)
  .then((markdownOutput) => {
    // markdownOutput contains the converted markdown
    fs.writeFileSync('docs/api/openapi.md', markdownOutput, 'utf8')
  })
  .catch((err) => {
    logger.error(err)
  })
