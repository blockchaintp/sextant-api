const mkdirp = require('mkdirp')
const fs = require('fs')
const async = require('async')
const settings = require('../settings')

const BASE_FOLDER = settings.fileStoreFolder

const FILENAMES = {
  settings: 'settings.json'
}

const FileStore = () => {

  mkdirp.sync(BASE_FOLDER)

  /*
  
    scan the folder - each cluster is a folder
    return an array of cluster names based on folder name

    params:
    
  */
  const listClusterNames = (params, done) => {
    async.waterfall([

      // list all files in our base folder
      (next) => fs.readdir(BASE_FOLDER, next),

      // filter down to only directories
      (files, next) => async.filter(files, (file, nextFile) => {
        fs.stat(path.join(BASE_FOLDER, file), (err, stat) => {
          if(err) return nextFile(null, false)
          nextFile(null, stat.isDirectory())
        })
      }, next),

    ], done)
  }

  /*
  
    list the names of all clusters and then map each name onto the data

    params:
    
  */
  const listClusters = (params, done) => {
    async.waterfall([

      // list all cluster names
      (next) => listClusterNames({}, next),

      (clusterNames, next) => {
        async.map(clusterNames, (id, nextCluster) => {
          getCluster({
            id,
          }, nextCluster)
        }, next)
      },

    ], done)
  }

  /*
  
    return the processed `settings.json` file from a cluster folder

    params:

     * id - string
    
  */
  const getCluster = (params, done) => {
    async.waterfall([

      // load the contents of the settings.json file in the cluster folder
      (next) => readClusterFile({
        id: params.id,
        filename: FILENAMES.settings,
      }, next),

      // process into an object
      (settingsFileContents, next) => {
        let processedFile = null
        try {
          processedFile = JSON.parse(settingsFileContents)
        } catch(e) {
          return next(e)
        }
        next(null, processedFile)
      },

    ], done)
  }

  /*
  
    write the given data into `settings.json` 

    params:

     * id - string
     * data - object
    
  */
  const createCluster = (params, done) => {
    if(!params.id) return done(`id param required for createCluster`)
    if(!params.data) return done(`data param required for createCluster`)

    writeClusterFile({
      id: params.id,
      filename: FILENAMES.settings,
      data: JSON.stringify(params.data),
    }, done)
  }


  /*
  
    return the contents of a file associated with a cluster

    params:

     * id - string
     * filename - string
    
  */
  const readClusterFile = (params, done) => {
    if(!params.id) return done(`id param required for readClusterFile`)
    if(!params.filename) return done(`filename param required for readClusterFile`)

    const filePath = path.join(BASE_FOLDER, params.id, params.filename)

    async.waterfall([

      // check the file exists
      (next) => fs.stat(filePath, next),

      // load the contents
      (stat, next) => fs.readFile(filePath, 'utf8', next),

    ], done)
  }

  /*
  
    write a file associated with a cluster - assuming text(utf8)
    create the cluster folder if it doesn't exist

    params:

     * id - string
     * filename - string
     * data - string
    
  */
  const writeClusterFile = (params, done) => {
    if(!params.id) return done(`id param required for writeClusterFile`)
    if(!params.filename) return done(`filename param required for writeClusterFile`)
    if(!params.data) return done(`data param required for writeClusterFile`)

    const folderPath = path.join(BASE_FOLDER, params.id)
    const filePath = path.join(folderPath, params.filename)

    async.series([

      // ensure the cluster folder exists
      next => mkdirp(folderPath, next),

      // write the file contents
      next => fs.writeFile(filePath, params.data, 'utf8', next),
    ])
  }


  return {
    listClusterNames,
    listClusters,
    getCluster,
    createCluster,
    readClusterFile,
    writeClusterFile,
  }

}

module.exports = FileStore