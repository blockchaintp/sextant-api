const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const async = require('async')
const settings = require('../settings')

const BASE_FOLDER = settings.fileStoreFolder
const CLUSTER_FOLDER = path.join(BASE_FOLDER, 'clusters')

const FILENAMES = {
  settings: 'settings.json',
  status: 'status.json',
  publicKey: 'id_rsa.pub',
}

const FileStore = () => {

  mkdirp.sync(CLUSTER_FOLDER)

  /*
  
    scan the folder - each cluster is a folder
    return an array of cluster names based on folder name

    params:
    
  */
  const listClusterNames = (params, done) => {
    async.waterfall([

      // list all files in our base folder
      (next) => fs.readdir(CLUSTER_FOLDER, next),

      // filter down to only directories
      (files, next) => async.filter(files, (file, nextFile) => {
        fs.stat(path.join(CLUSTER_FOLDER, file), (err, stat) => {
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
        async.map(clusterNames, (clustername, nextCluster) => {
          getCluster({
            clustername,
          }, nextCluster)
        }, next)
      },

    ], done)
  }

  /*
  
    return the processed `settings.json` file from a cluster folder

    params:

     * clustername - string
    
  */
  const getClusterSettings = (params, done) => {
    if(!params.clustername) return done(`clustername param required for getClusterSettings`)
    readClusterFileAsJSON({
      clustername: params.clustername,
      filename: FILENAMES.settings,
    }, done)
  }

  /*
  
    return the processed `status.json` file from a cluster folder

    params:

     * clustername - string
    
  */
  const getClusterStatus = (params, done) => {
    if(!params.clustername) return done(`clustername param required for getClusterStatus`)
    readClusterFileAsJSON({
      clustername: params.clustername,
      filename: FILENAMES.status,
    }, done)
  }

  /*
  
    return the processed `settings.json` and `status.json` files from a cluster folder

    params:

     * clustername - string
    
  */
  const getCluster = (params, done) => {
    if(!params.clustername) return done(`clustername param required for getCluster`)
    async.parallel({
      settings: next => getClusterSettings(params, next),
      status: next => getClusterStatus(params, next),
    }, done)

  }

  /*
  
    write the given data into `settings.json` 

    use the "name" param as the folder name

    params:

    {
      domain: "dev.catenasys.com.",
      master_size: 1,
      master_type: "m1.medium",
      master_zones: ["eu-west-2a"],
      name: "apples",
      node_size: 3,
      node_type: "m1.medium",
      node_zones: ["eu-west-2a"],
      region: "eu-west-2",
      topology: "public",
      public_key: "XXX",
    }
    
  */
  const createCluster = (params, done) => {
    if(!params.name) return done(`name param required for createCluster`)

    async.parallel({

      settings: next => writeClusterFile({
        clustername: params.name,
        filename: FILENAMES.settings,
        data: JSON.stringify(params),
      }, next),

      status: next => writeClusterFile({
        clustername: params.name,
        filename: FILENAMES.status,
        data: JSON.stringify({
          phase: 'creating',
        }),
      }, next),

      publicKey: next => writeClusterFile({
        clustername: params.name,
        filename: FILENAMES.publicKey,
        data: params.public_key,
      }, next),

    }, done)
    
  }

  /*
  
    return the filepath for a single file belonging to a cluster

    params:

     * clustername - string
     * filename - string
    
  */
  const getClusterFilePath = (params, done) => {
    if(!params.clustername) return done(`clustername param required for readClusterFile`)
    if(!params.filename) return done(`filename param required for readClusterFile`)

    const filePath = path.join(CLUSTER_FOLDER, params.clustername, params.filename)

    done(null, filePath)
  }

  /*
  
    return the contents of a file associated with a cluster

    params:

     * clustername - string
     * filename - string
    
  */
  const readClusterFile = (params, done) => {
    if(!params.clustername) return done(`clustername param required for readClusterFile`)
    if(!params.filename) return done(`filename param required for readClusterFile`)

    async.waterfall([

      // get the filepath
      (next) => getClusterFilePath(params, next),

      // check the file exists
      (filePath, next) => {
        fs.stat(filePath, (err, stat) => {
          if(err) return next(err)
          if(!stat) return next(`error ${filePath} does not exist`)
          next(null, filePath)
        })
      },

      // load the contents
      (filePath, next) => fs.readFile(filePath, 'utf8', next),

    ], done)
  }

  /*
  
    return the contents of a file associated with a cluster
    and process it as JSON

    params:

     * clustername - string
     * filename - string
    
  */
  const readClusterFileAsJSON = (params, done) => {
    async.waterfall([
      (next) => readClusterFile(params, next),
      (fileContents, next) => {
        let processedFile = null
        try {
          processedFile = JSON.parse(fileContents)
        } catch(e) {
          return next(e)
        }
        next(null, processedFile)
      }
    ], done)
  }

  /*
  
    write a file associated with a cluster - assuming text(utf8)
    create the cluster folder if it doesn't exist

    params:

     * clustername - string
     * filename - string
     * data - string
    
  */
  const writeClusterFile = (params, done) => {
    if(!params.clustername) return done(`clustername param required for writeClusterFile`)
    if(!params.filename) return done(`filename param required for writeClusterFile`)
    if(!params.data) return done(`data param required for writeClusterFile`)

    const folderPath = path.join(CLUSTER_FOLDER, params.clustername)
    const filePath = path.join(folderPath, params.filename)

    async.series([

      // ensure the cluster folder exists
      next => mkdirp(folderPath, next),

      // write the file contents
      next => fs.writeFile(filePath, params.data, 'utf8', next),
      
    ], done)
  }


  return {
    listClusterNames,
    listClusters,
    getCluster,
    getClusterSettings,
    getClusterStatus,
    createCluster,
    getClusterFilePath,
    readClusterFile,
    writeClusterFile,
  }

}

module.exports = FileStore