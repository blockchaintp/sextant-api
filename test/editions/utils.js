/* eslint-disable max-len */

const fs = require('fs')

const childProcess = require('child_process')
const Promise = require('bluebird')

const exec = Promise.promisify(childProcess.exec)

const addRepo = async (helmRepos) => {
  try {
    return await exec(`helm repo add ${helmRepos.name} ${helmRepos.url}`)
  } catch (error) {
    return error
  }
}

const removeRepo = async (helmRepos) => {
  try {
    return await exec(`helm repo remove ${helmRepos.name}`)
  } catch (error) {
    return error
  }
}

const sanitizeVersion = async (version) => {
  try {
    return version.match(/(\d+)\.(\d+)\.(\d+)/)
  } catch (error) {
    return error
  }
}

const searchRepo = async (deploymentVersionInfo) => {
  try {
    const response = await exec(`helm search repo ${deploymentVersionInfo.chart} --version ${deploymentVersionInfo.chartVersion} -o json`)
    return JSON.parse(response)
  } catch (error) {
    return error
  }
}

const getChartFileName = async (chartTableVersion, repoName) => {
  try {
    const chart = await searchRepo(chartTableVersion)
    const chartName = chart[0].name
    const chartVersion = chart[0].version
    const sanitizedName = await chartName.replace(`${repoName}/`, '')
    const fileName = `${sanitizedName}-${chartVersion}.tgz`
    return fileName
  } catch (error) {
    return error
  }
}

const confirmChartFileExists = async (fileName) => {
  try {
    const response = fs.existsSync(fileName)
    return response
  } catch (error) {
    return error
  }
}

const pullChart = async (deploymentVersionInfo) => {
  try {
    const response = await exec(`helm pull ${deploymentVersionInfo.chart} --version ${deploymentVersionInfo.chartVersion}`)
    return response
  } catch (error) {
    return error
  }
}

const removeChartFile = async (fileName) => {
  fs.unlinkSync(fileName)
}

const confirmChartsExist = async (chartTable) => {
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
  pullChart,
  removeChartFile,
  removeRepo,
  searchRepo,
  sanitizeVersion,
}
