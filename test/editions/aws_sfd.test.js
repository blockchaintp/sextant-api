const utils = require('./utils')
const asyncTest = require('../asyncTest')

const testedEdition = require('../../editions/aws_sfd')

const { edition } = testedEdition
const helmRepos = edition.helmRepos[0]
const { chartTable } = edition

asyncTest('repos exist and can be added', async (t) => {
  const response = await utils.addRepo(helmRepos)
  t.equals(response,
    `"${helmRepos.name}" has been added to your repositories\n`,
    `${helmRepos.name} was added to your repositories`)
})

// loop through every deployment type in chartTable
Object.keys(chartTable).forEach((deploymentType) => {
  // loop through every version of every deployment type
  Object.keys(chartTable[deploymentType]).forEach((deploymentVersion) => {
    const chartTableVersion = chartTable[deploymentType][deploymentVersion]

    asyncTest('an expected response is returned when chart is searched for in repo', async (t) => {
      // get semver values both for search and then the response
      const rawResponse = await utils.searchRepo(chartTableVersion)
      const version = await rawResponse[0].version
      // sanitize semver values to be comparable
      const sanitizedResponseVersion = await utils.sanitizeVersion(version)
      const sanitizedChartTableVersion = await utils.sanitizeVersion(chartTableVersion.chartVersion)

      t.equals(`${sanitizedChartTableVersion[1]}.${sanitizedChartTableVersion[2]}`,
        `${sanitizedResponseVersion[1]}.${sanitizedResponseVersion[2]}`,
        'searched semver values match returned semver values')
    })

    asyncTest('chart download is successful', async (t) => {
      await utils.pullChart(chartTableVersion)
      const fileName = await utils.getChartFileName(chartTableVersion, helmRepos.name)
      const isFile = await utils.confirmChartFileExists(fileName)
      t.ok(isFile, `correct filename found: ${fileName}`)
    }, async () => {
      const fileName = await utils.getChartFileName(chartTableVersion, helmRepos.name)
      console.log(`deleting: ${fileName}`);
      utils.removeChartFile(fileName)
    })

    asyncTest('chart table deployment has proper structure', async (t) => {
      const hasChart = await Object.prototype.hasOwnProperty.call(chartTableVersion, 'chart')
      const hasChartVersion = await Object.prototype.hasOwnProperty.call(chartTableVersion, 'chartVersion')
      const hasOrder = await Object.prototype.hasOwnProperty.call(chartTableVersion, 'order')
      const hasExtension = await Object.prototype.hasOwnProperty.call(chartTableVersion, 'extension')

      t.ok(hasChart, 'chartTable version contains chart')
      t.ok(hasChartVersion, 'chartTable version contains chartVersion')
      t.ok(hasOrder, 'chartTable version contains order')
      t.ok(hasExtension, 'chartTable version contains extension')
    })
  })
})

// convert this or add it to a final test as a cleanup callback

asyncTest('repos can be removed', async (t) => {
  const response = await utils.removeRepo(helmRepos)
  t.equals(response,
    `"${helmRepos.name}" has been removed from your repositories\n`,
    `"${helmRepos.name}" has been removed from your repositories`)
})

// test 1: can edition be added aka are chart name and url usable. Use addRepo()

// Goal #2: are helm charts downloadable
