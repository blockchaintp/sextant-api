/*

  NOTE - this could be replaced with something like Hashicorp vault
  at some point

*/

const SettingsStore = (knex) => {
  /*

    list all settings for sextant

  */
  // eslint-disable-next-line no-empty-pattern
  const list = ({}, trx) => (trx || knex).select('*')
    .from('settings')

  /*

    get a single setting

    params:

      * id or key

  */
  const get = ({
    id,
    key,
  }, trx) => {
    if (!id && !key) throw new Error('id or key must be given to store.settings.get')

    const queryParams = {}

    if (id) queryParams.id = id
    if (key) queryParams.key = key

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
  const create = async ({
    data: {
      key,
      value,
    },
  }, trx) => {
    if (!key) throw new Error('data.key param must be given to store.settings.create')
    if (!value) throw new Error('data.value param must be given to store.settings.create')

    const insertData = {
      key,
      value,
    }

    const [result] = await (trx || knex)('settings')
      .insert(insertData)
      .returning('*')
    return result
  }

  /*

    update a setting

    params:

      * key, value

  */
  const update = async ({
    key,
    data: {
      value,
    },
  }, trx) => {
    if (!key) throw new Error('key must be given to store.settings.update')
    if (!value) throw new Error('data.value param must be given to store.settings.update')

    const queryParams = {
      key,
    }

    if (key) queryParams.key = key

    const [result] = await (trx || knex)('settings')
      .where(queryParams)
      .update({
        value,
      })
      .returning('*')
    return result
  }

  /*

    delete a single settings

    params:

      * id or key

  */
  const del = async ({
    id,
    key,
  }, trx) => {
    if (!id && !key) throw new Error('id or key must be given to store.settings.del')

    const queryParams = {
    }

    if (id) queryParams.id = id
    if (key) queryParams.key = key

    const [result] = await (trx || knex)('settings')
      .where(queryParams)
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
  }
}

module.exports = SettingsStore
