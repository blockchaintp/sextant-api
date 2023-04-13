import childProcess from 'child_process'
import * as fsExtra from 'fs-extra'
import * as util from 'util'
import { ChartTable, Edition, HelmRepository } from './edition-type'
import { getLogger } from './logging'

const logger = getLogger({
  name: 'helmTool',
})
const exec = util.promisify(childProcess.exec)

type RepositorySpec = { name: string; password?: string; url: string; username?: string }

export class HelmTool {
  chartTable: ChartTable
  destinationDir: string
  helmRepos: HelmRepository[]

  constructor(edition: Edition, destinationDir = '/app/api/helmCharts') {
    if (!edition) throw new Error('no edition found')
    if (!edition.helmRepos) throw new Error('no helmRepos found')
    this.helmRepos = edition.helmRepos
    this.chartTable = edition.chartTable
    this.destinationDir = destinationDir
  }

  async add() {
    // runs helm add for all the repos in the editions object
    // iterate through the repos array adding each one
    const runHelmAdd = async (repo: RepositorySpec) => {
      logger.info({
        action: `adding ${repo.name} repository`,
      })
      const helmCommand = this.buildCommand(repo)
      logger.debug({ action: 'helm add', command: helmCommand })
      const result = await exec(helmCommand)
      logger.trace({ action: 'helm add', command: helmCommand, result })
      return result
    }
    for (const repo of this.helmRepos) {
      try {
        await runHelmAdd(repo)
      } catch (err: unknown) {
        logger.error({
          action: 'add repository',
          error: err,
        })
        process.exit(1)
      }
    }
  }

  buildCommand(repo: RepositorySpec) {
    // iterate over the repo config and build a helm command based on what's included in the config
    // add error handling that filters out username and password from error message
    let command = `helm repo add --force-update ${repo.name} ${repo.url}`

    if (repo.username) {
      command += ` --username ${repo.username}`
    }
    if (repo.password) {
      command += ` --password ${repo.password}`
    }
    return command
  }

  async start() {
    await this.add()
    await this.update()
    await this.storeChartsLocally()
  }

  async storeChartsLocally() {
    const getExactChartVersion = async (chart: string, chartVersion: string) => {
      const cmd = `helm search repo ${chart} --version ${chartVersion} -o json`
      logger.debug({ action: 'getExactChartVersion', command: cmd })
      const searchValue = await exec(cmd)
      logger.trace({ action: 'getExactChartVersion', command: cmd, result: searchValue })
      const parseVal = JSON.parse(searchValue.stdout) as { [key in string]: unknown }[]
      return parseVal[0].version as string
    }

    const remove = async (deploymentType: string) => {
      try {
        logger.debug(
          {
            fn: 'storeChartsLocally.remove',
          },
          `removing ${this.destinationDir}/${deploymentType} if found`
        )
        await fsExtra.remove(`${this.destinationDir}/${deploymentType}`)
      } catch (error: unknown) {
        logger.error({
          fn: 'remove()',
          error,
        })
        throw error
      }
    }

    const pull = async (
      chart: string,
      exactChartVersion: string,
      deploymentType: string,
      deploymentVersion: string
    ) => {
      const cmd =
        `helm pull ${chart} --version ${exactChartVersion} ` +
        ` --untar -d ${this.destinationDir}/${deploymentType}/${deploymentVersion}`
      try {
        logger.info(
          {
            fn: 'storeChartsLocally.removeAndPull',
          },
          `untaring the chart into ${this.destinationDir}/${deploymentType}/${deploymentVersion}`
        )
        logger.debug({ fn: 'removeAndPull', command: cmd }, 'helm pull')
        const result = await exec(cmd)
        logger.trace({ fn: 'removeAndPull', command: cmd, result }, 'helm pull')
        return result.stdout
      } catch (error: unknown) {
        logger.error({ fn: 'removeAndPull', command: cmd, error }, 'error in helm pull')
        throw error
      }
    }

    const removeAndPull = async (
      deploymentType: string,
      deploymentVersion: string,
      deploymentVersionData: {
        chart: string
        chartVersion: string
      }
    ) => {
      const { chart, chartVersion } = deploymentVersionData
      const exactChartVersion = await getExactChartVersion(chart, chartVersion)

      await remove(deploymentType)

      await pull(chart, exactChartVersion, deploymentType, deploymentVersion)
    }

    const deploymentTypes = Object.keys(this.chartTable)

    for (const deploymentType of deploymentTypes) {
      const deploymentTypeData = this.chartTable[deploymentType]

      const deploymentVersions = Object.keys(deploymentTypeData)
      for (const deploymentVersion of deploymentVersions) {
        try {
          const deploymentVersionData = deploymentTypeData[deploymentVersion]
          await removeAndPull(deploymentType, deploymentVersion, deploymentVersionData)
        } catch (error: unknown) {
          logger.error({ fn: 'removeAndPull', error }, 'error in helm pull')
          process.exit(1)
        }
      }
    }
  }

  async update() {
    try {
      logger.info({
        action: 'updating helm repositories',
      })
      const command = 'helm repo update'
      logger.debug({ action: 'helm repo update', command })
      const result = await exec(command)
      logger.trace({ action: 'helm repo update', command, result })
    } catch (err: unknown) {
      logger.error({
        action: 'helm repository update',
        error: err,
      })
      process.exit(1)
    }
  }
}
