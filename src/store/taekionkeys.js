const config = require('../config')

const TaekionKeysStore = (knex) => {

  const list = ({
    deployment,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.taekionkeys.list`)
    return (trx || knex).select('*')
      .from(config.TABLES.taekion_keys)
      .where({
        deployment,
      })
  }

  const get = ({
    deployment,
    id,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.taekionkeys.get`)
    if(!id) throw new Error(`id must be given to store.taekionkeys.get`)

    return (trx || knex).select('*')
      .from(config.TABLES.taekion_keys)
      .where({
        deployment,
        id,
      })
      .first()
  }

  const create = async ({
    deployment,
    data: {
      name,
      fingerprint,
    }
  }, trx) => {
    if(!deployment) throw new Error(`deployment param must be given to store.taekionkeys.create`)
    if(!name) throw new Error(`data.name param must be given to store.taekionkeys.create`)
    if(!fingerprint) throw new Error(`data.fingerprint param must be given to store.taekionkeys.create`)

    const [result] = await (trx || knex)(config.TABLES.taekion_keys)
      .insert({
        deployment,
        name,
        fingerprint,
      })
      .returning('*')
    return result
  }

  const del = async ({
    deployment,
    id,
  }, trx) => {
    if(!deployment) throw new Error(`deployment must be given to store.taekionkeys.delete`)
    if(!id) throw new Error(`id must be given to store.taekionkeys.delete`)
    const [result] = await (trx || knex)(config.TABLES.taekion_keys)
      .where({
        deployment,
        id,
      })
      .del()
      .returning('*')
    return result
  }

  return {
    list,
    get,
    create,
    delete: del, 
  }
}

module.exports = TaekionKeysStore