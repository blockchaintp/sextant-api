import childProcess from 'child_process'
import * as fsExtra from 'fs-extra'
import * as util from 'util'
import { ChartTable, Edition, HelmRepository } from './edition-type'
import { getLogger } from './logging'
import { Store } from './store'

const logger = getLogger({
  name: 'helmTool',
})
const exec = util.promisify(childProcess.exec)

export class HelmTool {
  chartTable: ChartTable
  destinationDir: string
  edition: Edition
  helmRepos: HelmRepository[]
  store: Store

  constructor(edition: Edition, store: Store, destinationDir = '/app/api/helmCharts') {
    this.helmRepos = edition.helmRepos
    this.chartTable = edition.chartTable
    this.store = store
    this.destinationDir = destinationDir
    logger.info({ destinationDir }, 'HelmTool created')
  }

  async add() {
    // runs helm add for all the repos in the editions object
    // iterate through the repos array adding each one
    const runHelmAdd = async (repo: HelmRepository) => {
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
      await runHelmAdd(repo)
    }
  }

  public buildCommand(repo: HelmRepository) {
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

  async getExactChartVersion(chart: string, chartVersion: string) {
    const cmd = `helm search repo ${chart} --version ${chartVersion} -o json`
    logger.debug({ action: 'getExactChartVersion', command: cmd })
    const searchValue = await exec(cmd)
    logger.trace({ action: 'getExactChartVersion', command: cmd, result: searchValue })
    const parseVal = JSON.parse(searchValue.stdout) as { [key in string]: unknown }[]
    return parseVal[0].version as string
  }

  async pull(chart: string, exactChartVersion: string, deploymentType: string, deploymentVersion: string) {
    const cmd =
      `helm pull ${chart} --version ${exactChartVersion} ` +
      ` --untar -d ${this.destinationDir}/${deploymentType}/${deploymentVersion}`
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
  }

  async refreshDbRepos() {
    // Get list of helm repos from the edition
    const editionRepos = this.helmRepos
    // Get list of helm repos from the database
    const dbRepos = await this.store.helmrepository.list()
    await this.store.transaction(async (trx) => {
      // For each helm repo in the edition, check if it is in the database
      for (const repo of editionRepos) {
        // check if the helm repo is already in the database
        const repoInDb = dbRepos.find((helmRepo) => helmRepo.name === repo.name)
        if (repoInDb) {
          // update the helm repo in the database
          await this.store.helmrepository.update(
            {
              data: {
                active: true,
                name: repo.name,
                url: repo.url,
              },
              id: repoInDb.id,
            },
            trx
          )
        } else {
          // add the helm repo to the database
          await this.store.helmrepository.create(
            {
              data: {
                active: true,
                name: repo.name,
                url: repo.url,
              },
            },
            trx
          )
        }
      }
    })
  }

  async remove(deploymentType: string) {
    logger.debug(
      {
        fn: 'storeChartsLocally.remove',
      },
      `removing ${this.destinationDir}/${deploymentType} if found`
    )
    await fsExtra.remove(`${this.destinationDir}/${deploymentType}`)
  }

  async removeAndPull(
    deploymentType: string,
    deploymentVersion: string,
    deploymentVersionData: {
      chart: string
      chartVersion: string
    }
  ) {
    const { chart, chartVersion } = deploymentVersionData
    const exactChartVersion = await this.getExactChartVersion(chart, chartVersion)

    await this.remove(deploymentType)

    await this.pull(chart, exactChartVersion, deploymentType, deploymentVersion)
  }

  async start() {
    try {
      await this.add()
      await this.update()
      await this.refreshDbRepos()
      await this.storeChartsLocally()
    } catch (err: unknown) {
      logger.error({ err }, 'Error running helmTool.start()')
      throw err
    }
  }

  async storeChartsLocally() {
    const deploymentTypes = Object.keys(this.chartTable)

    for (const deploymentType of deploymentTypes) {
      const deploymentTypeData = this.chartTable[deploymentType]

      const deploymentVersions = Object.keys(deploymentTypeData)
      for (const deploymentVersion of deploymentVersions) {
        const deploymentVersionData = deploymentTypeData[deploymentVersion]
        await this.removeAndPull(deploymentType, deploymentVersion, deploymentVersionData)
      }
    }
  }

  // Add in updating the helm-chart table to update
  async update() {
    logger.info({
      action: 'updating helm repositories',
    })
    const command = 'helm repo update'
    logger.debug({ action: 'helm repo update', command })
    const result = await exec(command)
    logger.trace({ action: 'helm repo update', command, result })
  }
}
