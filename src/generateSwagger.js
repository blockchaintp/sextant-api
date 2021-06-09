/**
 * Generates a swagger.json file for the api.
 */
const fs = require('fs')
const widdershins = require('widdershins')
const pino = require('pino')

const swaggerJsdoc = require('swagger-jsdoc');

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
};

const specs = swaggerJsdoc(options);

const widdershinsOptions = {
  language_tabs: [{ python: 'Python' }, { ruby: 'Ruby' }],
};

widdershins.convert(specs, widdershinsOptions)
  .then((markdownOutput) => {
  // markdownOutput contains the converted markdown
    fs.writeFileSync('build/openapi.md', markdownOutput, 'utf8');
  })
  .catch((err) => {
    pino.error(err)
  });
