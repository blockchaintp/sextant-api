/*
 * Copyright © 2018 Blockchain Technology Partners Limited All Rights Reserved
 *
 * License: Product
 */

const config = require('../config')

/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

const SettingsStore = (knex) => {

  /*

    list all settings for sextant

  */
  const list = ({}, trx) => {

    return (trx || knex).select('*')
      .from('settings')
  }

  /*

    get a single setting

    params:

      * id or key

  */
  const get = ({
    id,
    key,
  }, trx) => {
    if(!id && !key) throw new Error(`id or key must be given to store.settings.get`)

    const queryParams = {}

    if(id) queryParams.id = id
    if(key) queryParams.key = key

    return (trx || knex).select('*')
      .from('settings')
      .where(queryParams)
      .first()
  }

  /*

    insert a new settings

    params:

      * data
        * deployment
        * key
        * value || base64Data

  */
  const create = ({
    data: {
      key,
      value
    }
  }, trx) => {
    if(!key) throw new Error(`data.key param must be given to store.settings.create`)
    if(!value) throw new Error(`data.value param must be given to store.settings.create`)

    const insertData = {
      key,
      value,
    }

    return (trx || knex)('settings')
      .insert(insertData)
      .returning('*')
      .get(0)
  }

  /*

    update a setting

    params:


      * key, value

  */
  const update = ({
    key,
    data: {
      value
    }
  }, trx) => {

    if(!key) throw new Error(`key must be given to store.settings.update`)
    if(!value) throw new Error(`data.value param must be given to store.settings.update`)

    const queryParams = {
      key
    }

    if(key) queryParams.key = key

    return (trx || knex)('settings')
      .where(queryParams)
      .update({
        value: value,
      })
      .returning('*')
      .get(0)
  }

  /*

    delete a single settings

    params:

      * id or key

  */
  const del = ({
    id,
    key,
  }, trx) => {
    if(!id && !key) throw new Error(`id or key must be given to store.settings.del`)

    const queryParams = {
    }

    if(id) queryParams.id = id
    if(key) queryParams.key = key

    return (trx || knex)('settings')
      .where(queryParams)
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
  }

}

module.exports = SettingsStore
