const config = require('../config')
const base64 = require('../utils/base64')

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

const ClusterSecretStore = (knex) => {

  /*
  
    list all secrets for a single cluster

    params:

      * cluster

  */
  const list = ({
    cluster,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clustersecret.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.clustersecret

    return (trx || knex).select('*')
      .from(config.TABLES.clustersecret)
      .where({
        cluster: params.cluster,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }
  
  /*
  
    get a single secret for a single cluster

    params:

      * cluster
      * id or name
    
  */
  const get = ({
    cluster,
    id,
    name,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clustersecret.get`)
    if(!id && !name) throw new Error(`id or name must be given to store.clustersecret.get`)

    const queryParams = {
      cluster,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    return (trx || knex).select('*')
      .from(config.TABLES.clustersecret)
      .where(queryParams)
      .first()
  }

  /*
  
    insert a new clustersecret

    params:

      * data
        * cluster
        * name
        * rawData || base64Data
    
  */
  const create = ({
    data: {
      cluster,
      name,
      rawData,
      base64Data,
    }
  }, trx) => {
    if(!cluster) throw new Error(`data.cluster param must be given to store.clustersecret.create`)
    if(!name) throw new Error(`data.name param must be given to store.clustersecret.create`)
    if(!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to store.clustersecret.create`)

    const insertData = {
      cluster,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    return (trx || knex)(config.TABLES.clustersecret)
      .insert(insertData)
      .returning('*')
      .get(0)
  }

  /*
  
    update a clustersecret

    params:

      * cluster
      * id or name
      * data
        * rawData || base64Data
  
  */
  const update = ({
    cluster,
    id,
    name,
    data: {
      rawData,
      base64Data,
    }
  }, trx) => {

    if(!cluster) throw new Error(`cluster must be given to store.clustersecret.update`)
    if(!id && !name) throw new Error(`id or name must be given to store.clustersecret.update`)
    if(!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to store.clustersecret.update`)

    const queryParams = {
      cluster,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    return (trx || knex)(config.TABLES.clustersecret)
      .where(queryParams)
      .update({
        base64data: params.data.base64Data || base64.encode(params.data.rawData),
      })
      .returning('*')
      .get(0)
  }

  /*
  
    delete a single clustersecret

    params:

      * cluster
      * id or name

  */
  const del = ({
    cluster,
    id,
    name,
  }, trx) => {
    if(!cluster) throw new Error(`cluster must be given to store.clustersecret.del`)
    if(!id && !name) throw new Error(`id or name must be given to store.clustersecret.del`)

    const queryParams = {
      cluster,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name
    
    return (trx || knex)(config.TABLES.clustersecret)
      .where(queryParams)
      .del()
      .returning('*')
      .get(0)
  }

  /*
  
    replace a single clustersecret

    i.e. one of create or update

    params:

      * data
        * cluster
        * name
        * rawData || base64Data
    
  */
  const replace = async ({
    data: {
      cluster,
      name,
      rawData,
      base64Data,
    }
  }, trx) => {

    await del({
      cluster,
      name,
      transaction,
    }, trx)

    return create({
      data: {
        cluster,
        name,
        rawData,
        base64Data,
      },
    }, trx)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    replace,
  }
}

module.exports = ClusterSecretStore