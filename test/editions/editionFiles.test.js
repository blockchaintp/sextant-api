const utils = require('./utils')
const asyncTest = require('../asyncTest')

const EDITION_FILES = [
  'aws_sfd',
  'aws_sfd_nometer',
  'aws_sfs',
  'aws_sfs_nometer',
  'dev',
  'enterprise',
  'sft',
]

const editionFileTestSuite = (testedEdition) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const currentEdition = require(`../../src/edition/${testedEdition}`)
  const { edition } = currentEdition
  const helmRepos = edition.helmRepos[0]
  const { chartTable } = edition

  asyncTest('repos exist and can be added', async (t) => {
    const response = await utils.addRepo(helmRepos)
    t.equals(
      response,
      `"${helmRepos.name}" has been added to your repositories\n`,
      `${helmRepos.name} was successfully added to repo`
    )
  })

  // loop through every deployment type in chartTable
  Object.keys(chartTable).forEach((deploymentType) => {
    // loop through every version of every deployment type
    Object.keys(chartTable[deploymentType]).forEach((currentDeploymentVersion) => {
      const deploymentVersion = chartTable[deploymentType][currentDeploymentVersion]

      asyncTest('chart exists in the repo', async (t) => {
        // get semver values both for search and then the response
        const rawResponse = await utils.searchRepo(deploymentVersion)
        const version = await rawResponse[0].version
        // sanitize semver values to be comparable
        const sanitizedResponseVersion = await utils.sanitizeVersion(version)
        const sanitizedChartTableVersion = await utils.sanitizeVersion(deploymentVersion.chartVersion)

        t.equals(
          `${sanitizedChartTableVersion[1]}.${sanitizedChartTableVersion[2]}`,
          `${sanitizedResponseVersion[1]}.${sanitizedResponseVersion[2]}`,
          'searched semver values match returned semver values'
        )
      })

      asyncTest(
        'chart download is successful',
        async (t) => {
          await utils.pullChart(deploymentVersion)
          const fileName = await utils.getChartFileName(deploymentVersion, helmRepos.name)
          const isFile = await utils.confirmChartFileExists(fileName)
          t.ok(isFile, `correct filename found: ${fileName}`)
        },
        async () => {
          const fileName = await utils.getChartFileName(deploymentVersion, helmRepos.name)
          utils.removeChartFile(fileName)
        }
      )

      asyncTest('deployment version definition has proper structure', async (t) => {
        // define constant for Object.prototype.hasOwnProperty
        const property = await Object.prototype.hasOwnProperty
        const hasChart = property.call(deploymentVersion, 'chart')
        const hasChartVersion = property.call(deploymentVersion, 'chartVersion')
        const hasOrder = property.call(deploymentVersion, 'order')
        const hasExtension = property.call(deploymentVersion, 'extension')

        t.ok(hasChart, 'deployment version contains chart')
        t.ok(hasChartVersion, 'deployment version contains chartVersion')
        t.ok(hasOrder, 'deployment version contains order')
        t.ok(hasExtension, 'deployment version contains extension')
      })
    })
  })

  // convert this or add it to a final test as a cleanup callback

  asyncTest('repos can be removed', async (t) => {
    const response = await utils.removeRepo(helmRepos)
    t.equals(
      response,
      `"${helmRepos.name}" has been removed from your repositories\n`,
      `"${helmRepos.name}" has successfully been removed`
    )
  })
}

// iterate through every file in editions

const executeTestSuite = (editionDirectory) => {
  editionDirectory.forEach((edition) => {
    editionFileTestSuite(edition)
  })
  return 'completed test suite.'
}

executeTestSuite(EDITION_FILES)
