//  A store class for HelmRepository objects

import { Knex } from 'knex'
import { LIST_ORDER_BY_FIELDS, TABLES } from '../config'
import { DatabaseIdentifier } from './model/scalar-types'
import { HelmRepository } from './model/model-types'

export class HelmRepositoryStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  // Insert a new helm repository
  // params:
  //   * data
  //     * active
  //     * name
  //     * url

  public async create(
    {
      data: { active, name, url },
    }: {
      data: Pick<HelmRepository, 'active' | 'name' | 'url'>
    },
    trx?: Knex.Transaction
  ) {
    const [result] = await (trx || this.knex)<HelmRepository>(TABLES.helmrepository)
      .insert({
        active,
        name,
        url,
      })
      .returning('*')

    return result
  }

  // Delete a single helm repository
  // params:
  //  * id
  public async delete({ id }: { id: DatabaseIdentifier }, trx?: Knex.Transaction) {
    const [result] = await (trx || this.knex)<HelmRepository>(TABLES.helmrepository)
      .where({
        id,
      })
      .del()
      .returning('*')

    return result
  }

  // Get a single helm repository
  // params:
  //  * id
  public async get({ id }: { id: DatabaseIdentifier }, trx?: Knex.Transaction) {
    const [result] = await (trx || this.knex)<HelmRepository>(TABLES.helmrepository)
      .where({
        id,
      })
      .returning<HelmRepository[]>('*')

    return result
  }

  // Get a helm repository by its url
  // params:
  //  * url
  public async getByUrl({ url }: { url: string }, trx?: Knex.Transaction) {
    const [result] = await (trx || this.knex)<HelmRepository>(TABLES.helmrepository)
      .where({
        url,
      })
      .returning<HelmRepository[]>('*')

    return result
  }

  // List all helm repositories
  // params:  none
  public list(trx?: Knex.Transaction) {
    const orderBy = LIST_ORDER_BY_FIELDS.helmrepository
    return (trx || this.knex)<HelmRepository>(TABLES.helmrepository)
      .select('*')
      .orderBy(orderBy.field, orderBy.direction)
  }
  // Update a single helm repository
  // params:
  //  * id
  //  * data
  //    * active
  //    * name
  //    * url
  public async update(
    { data, id }: { data: Partial<Pick<HelmRepository, 'active' | 'name' | 'url'>>; id: DatabaseIdentifier },
    trx?: Knex.Transaction
  ) {
    const [result] = await (trx || this.knex)<HelmRepository>(TABLES.helmrepository)
      .where({
        id,
      })
      .update(data)
      .returning('*')

    return result
  }
}
