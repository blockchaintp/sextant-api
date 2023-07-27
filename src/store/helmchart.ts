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
  //     * urls

  public async create(
    {
      data: {
        active,
        app_version,
        description,
        digest,
        repository_id,
        icon,
        name,
        version,
        verified,
        keywords,
        kube_version,
        urls,
      },
    }: {
      data: Pick<
        HelmChart,
        | 'active'
        | 'app_version'
        | 'description'
        | 'digest'
        | 'repository_id'
        | 'icon'
        | 'name'
        | 'version'
        | 'verified'
        | 'keywords'
        | 'kube_version'
        | 'urls'
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
        verified,
        keywords,
        kube_version,
        urls,
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

  // Get an exact helm chart
  // Returns 0 or 1 helm charts
  // params:
  //  * name
  //  * version
  //  * repository_id
  public async getExact(
    { name, repository_id, version }: { name: string; repository_id: DatabaseIdentifier; version: string },
    trx?: Knex.Transaction
  ) {
    const [result] = await (trx || this.knex)<HelmChart>(TABLES.helmchart)
      .where({
        name,
        repository_id,
        version,
      })
      .returning<HelmChart[]>('*')

    return result
  }

  // Get matching helm charts
  // Returns 0, 1 or more helm charts
  // params:
  //  * name
  //  * version
  public async getMatching({ name }: { name: string }, trx?: Knex.Transaction) {
    const result = await (trx || this.knex)<HelmChart>(TABLES.helmchart)
      .where({
        name,
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
  //    * urls
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
