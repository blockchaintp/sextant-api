const mkdirp = require('mkdirp')
const rmdir = require('rmdir')
const fs = require('fs')
const path = require('path')
const async = require('async')
const settings = require('../settings')
const bcrypt = require('bcrypt')

const pino = require('pino')({
  name: 'filestore',
})

const FILENAMES = {
  clusters: 'clusters',
  users: 'users.json',
  objectStoreName: 'objectStoreName',
  kopsState: 'kopsState',
  sextantFlag: 'sextantFlag',
  settings: 'settings.json',
  deploymentSettings: 'deploymentSettings.json',
  status: 'status.json',
  publicKey: 'id_rsa.pub',
  kubeConfig: 'kubeconfig',
  kopsValues: 'kopsvalues.yaml',
  kopsConfig: 'kopsconfig.yaml',
  deploymentValues: 'deploymentvalues.yaml',
}

const ROOT_FOLDER = settings.fileStoreFolder


// this is temp storage local to the instance
const SESSION_STORE_FOLDER = path.join(ROOT_FOLDER, 'sessions')

// this is not saved in the store because it's the thing
// that connects to the remote store (chicken and egg)
const REMOTE_CONFIG_STORE_FOLDER = path.join(ROOT_FOLDER, 'remote-config')
const REMOTE_CONFIG_STORE_NAME_FILE = path.join(REMOTE_CONFIG_STORE_FOLDER, 'name')

const SEXTANT_STORE_FOLDER = path.join(ROOT_FOLDER, 'sextant')

/*

  remote is an implementation of a remote object storage

  it should present the following methods:

   * createFolder
   * deleteFolder
   * writeFile
   * exists (does a file or folder exist)
   * download (download the entire store locally)
  
*/
const FileStore = (opts) => {

  const remote = opts.remote

  /*
  
    the session store is always local - if the node dies,
    the users will have to login again
    
  */
  mkdirp.sync(SESSION_STORE_FOLDER)

  /*
  
    the remote store config folder is used to save the name of the object
    store we are synchronizing to
    
  */
  mkdirp.sync(REMOTE_CONFIG_STORE_FOLDER)

  /*
  
    make sure the local file store root folder exists
    
  */
  mkdirp.sync(SEXTANT_STORE_FOLDER)

  /*
  
    initialize the store

    check to see if we have an existing s3 bucket name
    if we do - then setup the remote with that name
    
  */
  const initialize = () => {

    async.waterfall([
      (next) => readObjectStoreName(next),
      (remoteObjectStoreName, next) => {
        if(remoteObjectStoreName) {
          pino.info({
            type: 'setupRemote',
            name: remoteObjectStoreName,
          })
          setupRemote({
            name: remoteObjectStoreName,
          }, next)  
        }
      },
    ], (err) => {
      if(err) {
        pino.error({
          type: 'initialize',
          error: err
        })
      }
    })
    
  }

  /*
  
    initialize the remote with the given name of resource

    this is done in the case we don't already know the name of the remote
    (i.e. the remote store name file is empty)

    this might mean the remote store exists it's just the instance failed and
    the user had to re-enter the name of the remote store bucket

    we pass the name of the bucket and the local storage path to the remote

    params:

     * name
    
  */
  const setupRemote = (params, done) => {
    async.series([
      next => remote.setup(params.name, SEXTANT_STORE_FOLDER, next),
      next => writeObjectStoreName(params.name, next),
    ], done)
  }
  

  /*
  
    low level file methods - these are always passed relative paths
    they will operate on the local filesystem (expanding the local path)
    into an absolute path

    they will also trigger the remote storage synchronizer with the relative path
    
  */

  /*
  
    paths
    
  */

  // check to see if the filename is in the database and resolve it if yes
  // otherwise return what is given
  const resolveFilename = (fileName) => FILENAMES[fileName] ? FILENAMES[fileName] : fileName

  // turn a fileName into a full local filepath
  const localPath = (fileName) => path.join(SEXTANT_STORE_FOLDER, resolveFilename(fileName))

  // return the relative directory path for where the files for a given cluster are stored
  const getClusterDirectoryPath = (clustername) => path.join(resolveFilename('clusters'), clustername)

  // return the relative path to a file within a cluster folder
  const getClusterFilePath = (clustername, filename) => path.join(getClusterDirectoryPath(clustername), resolveFilename(filename))
  const getLocalClusterFilePath = (clustername, filename) => localPath(getClusterFilePath(clustername, filename))

  /*
  
    read filesystem
    
  */

  const listFolder = (folderPath, done) => fs.readdir(localPath(folderPath), done)
  const readFile = (filePath, done) => fs.readFile(localPath(filePath), 'utf8', done)
  const statFile = (filePath, done) => fs.stat(localPath(filePath), (err, stat) => {
    if(err) return done(null)
    done(null, stat)
  })
  const readFileAsJSON = (filePath, done) => readFile(filePath, (err, fileContents) => {
    let processedFile = null
    try {
      processedFile = JSON.parse(fileContents)
    } catch(e) {
      return done(e)
    }
    done(null, processedFile)
  })

  
  /*
  
    write filesystem
    
  */

  const createFolder = (folderPath, done) => {
    mkdirp(localPath(folderPath), done)

    // trigger the remote here
  }

  const writeFile = (filePath, data, done) => {
    const LOCAL_PATH = localPath(filePath)
    fs.writeFile(LOCAL_PATH, data, 'utf8', (err) => {
      if(err) return done(err)
      done(null, LOCAL_PATH)
    })

    // trigger the remote here
  }

  const deleteFolder = (folderPath, done) => {
    rmdir(localPath(folderPath), done)

    // trigger the remote here
  }

  /*
  
    get the name of the object store resource the remote is using
    
  */
  const readObjectStoreName = (done) => {
    async.waterfall([
      (next) => fs.stat(REMOTE_CONFIG_STORE_NAME_FILE, (err, stat) => {
        if(err) return done(null, null)
        if(!stat) return done(null, null)
        next(null, stat)
      }),
      (stat, next) => {
        fs.readFile(REMOTE_CONFIG_STORE_NAME_FILE, 'utf8', next)
      }
    ], done)
  }

  /*
  
    write the name of the object store the remote is using
    we check with the remote that this is a valid resource name
    the remote will create the resource if it's valid and does not exist

    if the resource already exists,
    the remote will check for the existence of a `sextantVersion` file
    inside of the object store to confirm it's ok to re-connect

    
  */
  const writeObjectStoreName = (value, done) => {
    fs.writeFile(REMOTE_CONFIG_STORE_NAME_FILE, value, 'utf8', done)
  }
  
    

  /*
  
    return the stat object for a given cluster file
    can be used to check if a file exists or get it's size / modified date

    params:

     * clustername - string
     * filename - string
    
  */
  const statClusterFile = (params, done) => statFile(getClusterFilePath(params.clustername, params.filename), done)

  /*
  
    return the contents of a file associated with a cluster

    params:

     * clustername - string
     * filename - string
    
  */
  const readClusterFile = (params, done) => {
    if(!params.clustername) return done(`clustername param required for readClusterFile`)
    if(!params.filename) return done(`filename param required for readClusterFile`)
    const CLUSTER_FILE = getClusterFilePath(params.clustername, params.filename)
    readFile(CLUSTER_FILE, done)
  }

  /*
  
    return the contents of a file associated with a cluster
    and process it as JSON

    params:

     * clustername - string
     * filename - string
    
  */
  const readClusterFileAsJSON = (params, done) => {
    if(!params.clustername) return done(`clustername param required for readClusterFile`)
    if(!params.filename) return done(`filename param required for readClusterFile`)
    const CLUSTER_FILE = getClusterFilePath(params.clustername, params.filename)
    readFileAsJSON(CLUSTER_FILE, done)
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

    pino.info({
      action: 'writeClusterFile',
      params,
    })

    const CLUSTER_FILE = getClusterFilePath(params.clustername, params.filename)

    writeFile(CLUSTER_FILE, params.data, done)
  }


  /*
  
    scan the folder - each cluster is a folder
    return an array of cluster names based on folder name

    params:
    
  */
  const listClusterNames = (params, done) => {
    const CLUSTER_FOLDER = resolveFilename('clusters')
    async.waterfall([

      // list all files in our base folder
      (next) => listFolder(CLUSTER_FOLDER, next),

      // filter down to only directories
      (files, next) => async.filter(files, (file, nextFile) => {
        statFile(path.join(CLUSTER_FOLDER, file), (err, stat) => {
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
      filename: 'settings',
    }, done)
  }

  /*
  
    return the processed `deploymentSettings.json` file from a cluster folder

    params:

     * clustername - string
    
  */
  const getDeploymentSettings = (params, done) => {
    if(!params.clustername) return done(`clustername param required for getDeploymentSettings`)
    readClusterFileAsJSON({
      clustername: params.clustername,
      filename: 'deploymentSettings',
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
      filename: 'status',
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
  
    delete the state for a given cluster

    params:

     * clustername - string
    
  */
  const destroyCluster = (params, done) => {
    if(!params.clustername) return done(`clustername param required for destroyCluster`)

    pino.info({
      action: 'destroyCluster',
      params,
    })

    deleteFolder(getClusterDirectoryPath(params.clustername), done)
  }

  /*
  
    write the given data into `settings.json` 

    use the "name" param as the folder name

    params:

    {
      domain: "dev.catenasys.com.",
      master_count: 1,
      master_size: "m1.medium",
      master_zones: ["eu-west-2a"],
      name: "apples",
      node_count: 3,
      node_size: "m1.medium",
      node_zones: ["eu-west-2a"],
      region: "eu-west-2",
      topology: "public",
      public_key: "XXX",
    }
    
  */
  const createCluster = (params, done) => {
    if(!params.name) return done(`name param required for createCluster`)

    pino.info({
      action: 'createCluster',
      params,
    })

    const CLUSTER_FOLDER = getClusterDirectoryPath(params.name)

    async.series([

      // create the cluster folder
      next => createFolder(CLUSTER_FOLDER, next),

      // write the initial cluster files
      next => {
        async.parallel({
          settings: nextp => writeClusterFile({
            clustername: params.name,
            filename: 'settings',
            data: JSON.stringify(params),
          }, nextp),

          status: nextp => writeClusterFile({
            clustername: params.name,
            filename: 'status',
            data: JSON.stringify({
              phase: 'creating',
            }),
          }, nextp),

          publicKey: nextp => writeClusterFile({
            clustername: params.name,
            filename: 'publicKey',
            data: params.public_key,
          }, nextp),

        }, next)
      }
    ], done)
  }

  /*
  
    write the given details into the 'status.json' file of the given cluster

    params:

     * clustername
     * status - the data that will written into the 'status.json' file
    
  */
  const updateClusterStatus = (params, done) => {
    if(!params.clustername) return done(`clustername param required for updateClusterStatus`)
    if(!params.status) return done(`status param required for updateClusterStatus`)

    pino.info({
      action: 'updateClusterStatus',
      params,
    })

    writeClusterFile({
      clustername: params.clustername,
      filename: 'status',
      data: JSON.stringify(params.status),
    }, done)
  }

  /*
  
    set the cluster into error state by writing 'phase: error' to the status.json

    params:

     * clustername
     * error
     * errorPhase - what was the thing we were trying to do when the error happened?
    
  */
  const setClusterError = (params, done) => {
    if(!params.clustername) return done(`clustername param required for setClusterError`)
    if(!params.error) return done(`error param required for setClusterError`)

    pino.info({
      action: 'setClusterError',
      params,
    })
  
    updateClusterStatus({
      clustername: params.clustername,
      status: {
        phase: 'error',
        error: params.error,
        errorPhase: params.errorPhase,
      }
    }, done)
  }

  /*
  
    list the current users

    params:
    
  */
  const listUsers = (params, done) => {
    const USERS_FILE = resolveFilename('users')
    async.series([
      // if the users file does not exist - return empty list
      next => statFile(USERS_FILE, (err, stat) => {
        if(err) return done(null, [])
        next()
      }),

      next => readFileAsJSON(USERS_FILE, done),
    ])
  }

  /*
  
    get a user with a given username

    params:

     * username
    
  */
  const getUser = (params, done) => {
    if(!params.username) return done(`username param required for getUser`)

    async.waterfall([
      (next) => listUsers({}, next),
      (users, next) => {
        const foundUser = users.filter(user => user.username == params.username)[0]
        next(null, foundUser)
      }
    ], done)
  }

  /*
  
    check the password for a given user

    params:

     * username
     * password
    
  */
  const checkUserPassword = (params, done) => {
    if(!params.username) return done(`username param required for checkUserPassword`)
    if(!params.password) return done(`password param required for checkUserPassword`)

    async.series([

      // check a user with that username exists
      next => {
        getUser({
          username: params.username
        }, (err, user) => {
          if(err) return next(err)
          if(!user) return next(`there is no user with the username ${params.username}`)
          next()
        })
      },

      next => {
        async.waterfall([

          (nextw) => getUser({
            username: params.username,
          }, nextw),
            
          (existingUser, nextw) => {
            bcrypt.compare(params.password, existingUser.hashedPassword, (err, res) => {
              if(err) return done(err)
              done(null, res)
            })
          }  
        ], next)
      }
    ], done)
  }

  /*
  
    add a new user

    parans:

     * username
     * password
     * type (admin | normal)
    
  */
  const addUser = (params, done) => {
    if(!params.username) return done(`username param required for addUser`)
    if(!params.password) return done(`password param required for addUser`)
    if(!params.type) return done(`type param required for addUser`)

    const USERS_FILE = resolveFilename('users')

    async.series([

      // check that a user with that username does not exist already
      next => {
        getUser({
          username: params.username
        }, (err, user) => {
          if(err) return next(err)
          if(user) return next(`a user with the username ${params.username} already exists`)
          next()
        })
      },

      // create the user with the password hashed
      next => {
        async.waterfall([

          (nextw) => {
            async.parallel({
              hashedPassword: nextp => bcrypt.hash(params.password, 10, nextp),
              currentUsers: nextp => listUsers({}, nextp),
            }, nextw)
          },

          (results, nextw) => {
            const newUser = {
              username: params.username,
              type: params.type,
              hashedPassword: results.hashedPassword,
            }

            const newUsers = results.currentUsers.concat([newUser])

            writeFile(USERS_FILE, JSON.stringify(newUsers), nextw)
          }  
        ], next)
      }
    ], done)
  }

  /*
  
    update an existing user

    params:

      * existingUsername
      * username
      * password (optional)
      * type (admin | normal) (optional)
    
  */
  const updateUser = (params, done) => {

    if(!params.existingUsername) return done(`existingUsername param required for addUser`)
    if(!params.username) return done(`username param required for addUser`)

    const USERS_FILE = resolveFilename('users')

    async.series([

      // check a user with that username exists
      next => {
        getUser({
          username: params.existingUsername
        }, (err, user) => {
          if(err) return next(err)
          if(!user) return next(`there is no user with the username ${params.existingUsername}`)
          next()
        })
      },

      // update the given user
      next => {
        async.waterfall([

          (nextw) => {
            async.parallel({
              hashedPassword: nextp => {
                if(!params.password) return nextp()
                bcrypt.hash(params.password, 10, nextp)
              },
              currentUsers: nextp => listUsers({}, nextp),
            }, nextw)
          },

          (results, nextw) => {

            const existingUser = results.currentUsers.filter(user => user.username == params.existingUsername)[0]

            if(results.hashedPassword) {
              existingUser.hashedPassword = results.hashedPassword
            }

            existingUser.username = params.username

            if(params.type) {
              existingUser.type = params.type
            }

            const newUsers = results.currentUsers.map(user => {
              if(user.username != params.existingUsername) return user
              return existingUser
            })

            writeFile(USERS_FILE, JSON.stringify(newUsers), nextw)
          }  
        ], next)
      }
    ], done)
  }

  /*
  
    delete an existing user

    params:

      * username
    
  */
  const deleteUser = (params, done) => {
    if(!params.username) return done(`username param required for addUser`)

    const USERS_FILE = resolveFilename('users')

    async.series([

      // check a user with that username exists
      next => {
        getUser({
          username: params.username
        }, (err, user) => {
          if(err) return next(err)
          if(!user) return next(`there is no user with the username ${params.username}`)
          next()
        })
      },

      // update the given user
      next => {
        async.waterfall([

          (nextw) => listUsers({}, nextw),

          (currentUsers, nextw) => {
            const newUsers = currentUsers.filter(user => user.username != params.username)
            writeFile(USERS_FILE, JSON.stringify(newUsers), nextw)
          }  
        ], next)
      }
    ], done)
  }


  return {
    initialize,
    setupRemote,
    readObjectStoreName,
    listClusterNames,
    listClusters,
    getCluster,
    getClusterSettings,
    getDeploymentSettings,
    getClusterStatus,
    createCluster,
    destroyCluster,
    getClusterDirectoryPath,
    getClusterFilePath,
    getLocalClusterFilePath,
    readClusterFile,
    statClusterFile,
    writeClusterFile,
    updateClusterStatus,
    setClusterError,
    listUsers,
    getUser,
    checkUserPassword,
    addUser,
    updateUser,
    deleteUser,
    SESSION_STORE_FOLDER,
  }

}

module.exports = FileStore