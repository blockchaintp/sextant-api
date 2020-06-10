const config = require('../config')
const base64 = require('../utils/base64')

const ClusterFileStore = (knex) => {

  /*
  
    list all files for a single cluster

    params:

      * cluster

  */
  const list = ({
    cluster,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clusterfile.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.clusterfile

    return (trx || knex).select('*')
      .from(config.TABLES.clusterfile)
      .where({
        cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }
  
  /*
  
    get a single file for a single cluster

    params:

      * cluster
      * id or name
    
  */
  const get = ({
    cluster,
    id,
    name,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clusterfile.get`)
    if(!id && !name) throw new Error(`id or name must be given to store.clusterfile.get`)

    const queryParams = {
      cluster,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    return (trx || knex).select('*')
      .from(config.TABLES.clusterfile)
      .where(queryParams)
      .first()
  }

  /*
  
    insert a new clusterfile

    params:

      * data
        * cluster
        * name
        * rawData
        * base64Data
    
  */
  const create = async ({
    data: {
      cluster,
      name,
      rawData,
      base64Data,
    }
  }, trx) => {
    if(!cluster) throw new Error(`data.cluster param must be given to store.clusterfile.create`)
    if(!name) throw new Error(`data.name param must be given to store.clusterfile.create`)
    if(!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to store.clusterfile.create`)

    const insertData = {
      cluster,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    const [result] = await (trx || knex)(config.TABLES.clusterfile)
      .insert(insertData)
      .returning('*')
    return result
  }

  /*
  
    update a clusterfile

    params:

      * cluster
      * id or name
      * data
        * rawData
    
  */
  const update = async ({
    cluster,
    id,
    name,
    data: {
      rawData,
      base64Data,
    }
  }, trx) => {

    if(!cluster) throw new Error(`cluster must be given to store.clusterfile.update`)
    if(!id && !name) throw new Error(`id or name must be given to store.clusterfile.update`)
    if(!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to store.clusterfile.update`)

    const queryParams = {
      cluster,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    const [result] = await (trx || knex)(config.TABLES.clusterfile)
      .where(queryParams)
      .update({
        base64data: base64Data || base64.encode(rawData),
      })
      .returning('*')
    return result
  }

  /*
  
    delete a single clusterfile

    params:

      * cluster
      * id or name

  */
  const del = async ({
    cluster,
    id,
    name,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clusterfile.get`)
    if(!id && !name) throw new Error(`id or name must be given to store.clusterfile.get`)

    const queryParams = {
      cluster,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name
    
    const [result] = await (trx || knex)(config.TABLES.clusterfile)
      .where(queryParams)
      .del()
      .returning('*')
    return result
  }

  /*
  
    delete all files for a cluster

    params:

      * cluster

  */
  const deleteForCluster = async ({
    cluster,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clusterfile.del`)
    const [result] = await (trx || knex)(config.TABLES.clusterfile)
      .where({
        cluster,
      })
      .del()
      .returning('*')
    return result
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    deleteForCluster,
  }
}

module.exports = ClusterFileStore