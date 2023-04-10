//  A store class for HelmChart objects

import { Knex } from 'knex'
import { LIST_ORDER_BY_FIELDS, TABLES } from '../config'
import { DatabaseIdentifier } from './model/scalar-types'
import { HelmChart } from './model/model-types'

export class HelmChartStore {
  private knex: Knex
  constructor(knex: Knex) {
    this.knex = knex
  }

  // Insert a new helm chart
  // params:
  //   * data
  //     * active
  //     * name
  //     * app_version
  //     * description
  //     * digest
  //     * repository_id
  //     * icon
  //     * version
  //     * keywords

  public async create(
    {
      data: { active, app_version, description, digest, repository_id, icon, name, version, keywords },
    }: {
      data: Pick<
        HelmChart,
        'active' | 'app_version' | 'description' | 'digest' | 'repository_id' | 'icon' | 'name' | 'version' | 'keywords'
      >
    },
    trx?: Knex.Transaction
  ) {
    const [result] = await (trx || this.knex)<HelmChart>(TABLES.helmchart)
      .insert({
        active,
        app_version,
        description,
        digest,
        repository_id,
        icon,
        name,
        version,
        keywords,
      })
      .returning('*')

    return result
  }

  // Delete a single helm chart
  // params:
  //  * id
  public async delete({ id }: { id: DatabaseIdentifier }, trx?: Knex.Transaction) {
    const [result] = await (trx || this.knex)<HelmChart>(TABLES.helmchart)
      .where({
        id,
      })
      .del()
      .returning<HelmChart[]>('*')

    return result
  }

  // Get a single helm chart
  // params:
  //  * id
  public async get({ id }: { id: DatabaseIdentifier }, trx?: Knex.Transaction) {
    const [result] = await (trx || this.knex)<HelmChart>(TABLES.helmchart)
      .where({
        id,
      })
      .returning<HelmChart[]>('*')

    return result
  }

  // List all helm charts
  // params:
  public list(trx?: Knex.Transaction) {
    const orderBy = LIST_ORDER_BY_FIELDS.helmchart
    return (trx || this.knex)<HelmChart>(TABLES.helmchart).select('*').orderBy(orderBy.field, orderBy.direction)
  }

  // Update a single helm chart
  // params:
  //  * id
  //  * data
  //    * active
  //    * name
  //    * app_version
  //    * description
  //    * digest
  //    * repository_id
  //    * icon
  //    * version
  //    * keywords
  public async update(
    { data, id }: { data: Partial<Omit<HelmChart, 'id'>>; id: DatabaseIdentifier },
    trx?: Knex.Transaction
  ) {
    const [result] = await (trx || this.knex)<HelmChart>(TABLES.helmchart)
      .where({
        id,
      })
      .update({
        ...data,
      })
      .returning('*')

    return result
  }
}
