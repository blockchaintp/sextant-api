const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const merge = require('deepmerge')
const yaml = require('js-yaml')
const tmp = require('tmp')
const childProcess = require('child_process')

const readFile = Promise.promisify(fs.readFile)
const readdir = Promise.promisify(fs.readdir)
const writeFile = Promise.promisify(fs.writeFile)
const tempFile = Promise.promisify(tmp.file)
const tmpDir = Promise.promisify(tmp.dir)
const exec = Promise.promisify(childProcess.exec)

/*

  for a template type and version - return the folder
  in which the helm charts live

*/
const getChartsFolder = ({
  deployment_type,
  deployment_version,
}) => path.resolve(__dirname, deployment_type, deployment_version, 'charts')


// get all of the files in the helm charts directory

const getCharts = async ({
  deployment_type,
  deployment_version,
}) => {
  try {
    const chartsFolder = getChartsFolder({
      deployment_type,
      deployment_version,
    })
    const files = await readdir(chartsFolder)
    return files
  } catch (err) {
    console.log("---- calling getChartsFolder() returned an error ------");
    console.log(err);
    console.log("----- There is probably not a charts directory -----");
  }
}


module.exports = {
  getChartsFolder,
  getCharts
}
