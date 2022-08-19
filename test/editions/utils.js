/* eslint-disable max-len */

const fs = require('fs')

const { exec } = require('child-process-promise')

const logger = require('../../src/logging').getLogger({
  name: 'utils',
})

const addRepo = async (helmRepos) => {
  const cmd = `helm repo add ${helmRepos.name} ${helmRepos.url}`
  logger.debug({ action: 'helm', command: `${cmd}` })
  const result = await exec(cmd)
  logger.trace({ action: 'helm', command: `${cmd}`, result })
  return result.stdout
}

const getEditionFiles = (directoryName) => fs.readdirSync(directoryName)

const removeRepo = async (helmRepos) => {
  const cmd = `helm repo remove ${helmRepos.name}`
  logger.debug({ action: 'helm', command: `${cmd}` })
  const result = await exec(cmd)
  logger.trace({ action: 'helm', command: `${cmd}`, result })
  return result.stdout
}

const sanitizeVersion = (version) => version.match(/(\d+)\.(\d+)\.(\d+)/)

const searchRepo = async (deploymentVersionInfo) => {
  const cmd = `helm search repo ${deploymentVersionInfo.chart} --version ${deploymentVersionInfo.chartVersion} -o json`
  try {
    logger.debug({ action: 'helm', command: `${cmd}` })
    const result = await exec(cmd)
    logger.debug({ action: 'helm', command: `${cmd}`, result })
    return JSON.parse(result.stdout)
  } catch (error) {
    logger.warn({ action: 'helm', command: `${cmd}`, error })
    throw error
  }
}

const getChartFileName = async (chartTableVersion, repoName) => {
  try {
    const chart = await searchRepo(chartTableVersion)
    const chartName = chart[0].name
    const chartVersion = chart[0].version
    const sanitizedName = chartName.replace(`${repoName}/`, '')
    return `${sanitizedName}-${chartVersion}.tgz`
  } catch (error) {
    logger.error({ action: 'getChartFileName', error })
    throw error
  }
}

const confirmChartFileExists = (fileName) => fs.existsSync(fileName)

const pullChart = async (deploymentVersionInfo) => {
  const cmd = `helm pull ${deploymentVersionInfo.chart} --version ${deploymentVersionInfo.chartVersion}`
  logger.debug({ action: 'helm', command: `${cmd}` })
  const result = await exec(cmd)
  logger.trace({ action: 'helm', command: `${cmd}`, result })
  return result.stdout
}

const removeChartFile = (fileName) => {
  fs.unlinkSync(fileName)
}

const confirmChartsExist = (chartTable) => {
  Object.keys(chartTable).forEach((deploymentType) => {
    Object.keys(chartTable[deploymentType]).forEach((deploymentVersion) => {
      const deploymentVersionInfo = chartTable[deploymentType][deploymentVersion]
      searchRepo(deploymentVersionInfo)
      pullChart(deploymentVersionInfo)
    })
  })
}

module.exports = {
  addRepo,
  confirmChartFileExists,
  confirmChartsExist,
  getChartFileName,
  getEditionFiles,
  pullChart,
  removeChartFile,
  removeRepo,
  searchRepo,
  sanitizeVersion,
}
