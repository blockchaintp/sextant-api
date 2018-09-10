const Configmaps = require('./configmaps')
const Storageclass = require('./storageclass')
const Monitoring = require('./monitoring')
const Rbac = require('./rbac')
const Seed = require('./seed')

const Index = ({ clusterSettings }) => {
  return [
    Configmaps({ clusterSettings }),
    Storageclass.FastStorageClass({ clusterSettings }),
    Storageclass.SlowStorageClass({ clusterSettings }),
    Monitoring.GrafanaService({ clusterSettings }),
    Monitoring.InfluxDBService({ clusterSettings }),
    Monitoring.StatefulSet({ clusterSettings }),
    Rbac.ExternalService({ clusterSettings }),
    Rbac.RbacService({ clusterSettings }),
    Rbac.StatefulSet({ clusterSettings }),
    Seed.RestApiService({ clusterSettings }),
    Seed.ValidatorService({ clusterSettings }),
    Seed.StatefulSet({ clusterSettings }),
  ].join("\n---\n")
}

module.exports = Index