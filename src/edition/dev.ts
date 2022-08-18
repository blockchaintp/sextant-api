/* eslint-disable import/prefer-default-export */
// Edition object for dev mode
import { BTP_UNSTABLE, UNSTABLE_CHARTS } from './charts/repositories'
import { EMPTY } from './deployment'
import METERING from './metering/metering'
import { SextantEdition } from './types'

export const edition: SextantEdition = {
  deployment: EMPTY,
  metering: METERING.DEV,
  helmRepos: [BTP_UNSTABLE],
  chartTable: {
    besu: {
      1.4: {
        ...UNSTABLE_CHARTS.BESU,
        order: 1,
      },
    },
    sawtooth: {
      1.1: {
        ...UNSTABLE_CHARTS.SAWTOOTH,
        order: 2,
      },
    },
    'daml-on-besu': {
      1.3: {
        ...UNSTABLE_CHARTS.DAML_ON_BESU,
        order: 3,
      },
    },
    'daml-on-sawtooth': {
      1.3: {
        ...UNSTABLE_CHARTS.DAML_ON_SAWTOOTH,
        order: 4,
      },
    },
    'daml-on-qldb': {
      1.3: {
        ...UNSTABLE_CHARTS.DAML_ON_QLDB,
        order: 5,
      },
    },
    'daml-on-postgres': {
      1.3: {
        ...UNSTABLE_CHARTS.DAML_ON_POSTGRES,
        order: 6,
      },
    },
    'tfs-on-sawtooth': {
      0.1: {
        ...UNSTABLE_CHARTS.TFS_ON_SAWTOOTH,
        order: 7,
      },
    },
    sextant: {
      2.1: {
        ...UNSTABLE_CHARTS.SEXTANT,
        order: 8,
      },
    },
    elasticsearch: {
      7.9: {
        ...UNSTABLE_CHARTS.ELASTICSEARCH,
        order: 9,
      },
    },
    fluentd: {
      1.11: {
        ...UNSTABLE_CHARTS.FLUENTD,
        order: 10,
      },
    },
    kibana: {
      7.8: {
        ...UNSTABLE_CHARTS.KIBANA,
        order: 11,
      },
    },
    influxdb: {
      1.8: {
        ...UNSTABLE_CHARTS.INFLUXDB,
        order: 12,
      },
    },
    grafana: {
      7.1: {
        ...UNSTABLE_CHARTS.GRAFANA,
        order: 13,
      },
    },
    'postgresql-ha': {
      11.9: {
        ...UNSTABLE_CHARTS.POSTGRESQL_HA,
        order: 14,
      },
    },
    'nginx-ingress': {
      1.8: {
        ...UNSTABLE_CHARTS.NGINX_INGRESS,
        order: 15,
      },
    },
    openebs: {
      '2.0': {
        ...UNSTABLE_CHARTS.OPENEBS,
        order: 16,
      },
    },
    vault: {
      1.5: {
        ...UNSTABLE_CHARTS.VAULT,
        order: 17,
      },
    },
  },
}
