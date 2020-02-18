/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const config = require('../config')
const base64 = require('../utils/base64')

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

const DeploymentSecretStore = (knex) => {

  /*

    list all secrets for a single deployment

    params:

      * deployment

  */
  const list = ({
    deployment,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.deploymentsecret.list`)

    const orderBy = config.LIST_ORDER_BY_FIELDS.deploymentsecret

    return (trx || knex).select('*')
      .from(config.TABLES.deploymentsecret)
      .where({
        deployment,
      })
      .orderBy(orderBy.field, orderBy.direction)
  }

  /*

    get a single secret for a single deployment

    params:

      * deployment
      * id or name

  */
  const get = ({
    deployment,
    id,
    name,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.deploymentsecret.get`)
    if(!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.get`)

    const queryParams = {
      deployment,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    return (trx || knex).select('*')
      .from(config.TABLES.deploymentsecret)
      .where(queryParams)
      .first()
  }

  /*

    insert a new deploymentsecret

    params:

      * data
        * deployment
        * name
        * rawData || base64Data

  */
  const create = ({
    data: {
      deployment,
      name,
      rawData,
      base64Data,
    }
  }, trx) => {
    if(!deployment) throw new Error(`data.deployment param must be given to store.deploymentsecret.create`)
    if(!name) throw new Error(`data.name param must be given to store.deploymentsecret.create`)
    if(!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to store.deploymentsecret.create`)

    const insertData = {
      deployment,
      name,
      base64data: base64Data || base64.encode(rawData),
    }

    return (trx || knex)(config.TABLES.deploymentsecret)
      .insert(insertData)
      .returning('*')
      .get(0)
  }

  /*

    update a deploymentsecret

    params:

      * deployment
      * id or name
      * data
        * rawData || base64Data

  */
  const update = ({
    deployment,
    id,
    name,
    data: {
      rawData,
      base64Data,
    }
  }, trx) => {

    if(!deployment) throw new Error(`deployment must be given to store.deploymentsecret.update`)
    if(!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.update`)
    if(!rawData && !base64Data) throw new Error(`data.rawData or data.base64Data param must be given to store.deploymentsecret.update`)

    const queryParams = {
      deployment,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    return (trx || knex)(config.TABLES.deploymentsecret)
      .where(queryParams)
      .update({
        base64data: base64Data || base64.encode(rawData),
      })
      .returning('*')
      .get(0)
  }

  /*

    delete a single deploymentsecret

    params:

      * deployment
      * id or name

  */
  const del = ({
    deployment,
    id,
    name,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.deploymentsecret.del`)
    if(!id && !name) throw new Error(`id or name must be given to store.deploymentsecret.del`)

    const queryParams = {
      deployment,
    }

    if(id) queryParams.id = id
    if(name) queryParams.name = name

    return (trx || knex)(config.TABLES.deploymentsecret)
      .where(queryParams)
      .del()
      .returning('*')
      .get(0)
  }

  /*

    replace a single deploymentsecret

    i.e. one of create or update

    params:

      * data
        * deployment
        * name
        * rawData || base64Data

  */
  const replace = async ({
    data: {
      deployment,
      name,
      rawData,
      base64Data,
    }
  }, trx) => {

    await del({
      deployment,
      name,
    }, trx)

    return create({
      data: {
        deployment,
        name,
        rawData,
        base64Data,
      },
    }, trx)
  }

  /*

    delete all secrets for a deployment

    params:

      * deployment

  */
  const deleteForDeployment = ({
    deployment,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.deploymentsecret.deleteForDeployment`)
    return (trx || knex)(config.TABLES.deploymentsecret)
      .where({
        deployment,
      })
      .del()
      .returning('*')
      .get(0)
  }

  return {
    list,
    get,
    create,
    update,
    delete: del,
    replace,
    deleteForDeployment,
  }
}

module.exports = DeploymentSecretStore
