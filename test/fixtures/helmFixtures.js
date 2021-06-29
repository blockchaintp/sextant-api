const fsExtra = require('fs-extra')

const pino = require('pino')({
  name: 'helmChart fixtures',
})

const src = './test/fixtures/helmCharts/'
const dest = './helmCharts'

const copyFixtures = () => {
  fsExtra.copy(src, dest)
    .catch((err) => {
      pino.error({
        action: 'copy helmChart fixtures to ./helmCharts',
        error: err,
      })
    });
}

const removeFixtures = () => {
  fsExtra.emptyDir(dest)
    .catch((err) => {
      pino.error({
        action: 'remove helm charts from ./helmCharts',
        error: err,
      })
    })
}

module.exports = {
  copyFixtures,
  removeFixtures,
}
