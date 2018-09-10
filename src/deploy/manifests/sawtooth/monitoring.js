const GrafanaService = ({ clusterSettings }) => {
  const domainName = `monitoring.${ clusterSettings.name }.${ clusterSettings.domain }`
  return `apiVersion: v1
kind: Service
metadata:
  name: grafana
  labels:
    app: sawtooth-monitoring
    dns: route53
  annotations:
    domainName: "${ domainName }"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    protocol: TCP
    targetPort: 3000
    name: grafana
  selector:
    app: sawtooth-monitoring
`
}

const InfluxDBService = ({ clusterSettings }) => {
  return `apiVersion: v1
kind: Service
metadata:
  name: influxdb
  labels:
    app: sawtooth-monitoring
spec:
  ports:
  - port: 8086
    protocol: TCP
    targetPort: 8086
    name: influxdb
  selector:
    app: sawtooth-monitoring
`
}

const StatefulSet = ({ clusterSettings }) => {
  return `apiVersion: apps/v1
kind: StatefulSet 
metadata:
  name: sawtooth-monitoring
  labels:
    app: sawtooth-monitoring
spec:
  selector:
    matchLabels:
      app: sawtooth-monitoring
  serviceName: "sawtooth-monitoring"
  template:
    metadata:
      labels:
        app: sawtooth-monitoring
    spec:
      containers:
      - name: sawtooth-stats-influxdb
        image: kodonnel/sawtooth-stats-influxdb:btp-1-0-staging-01
        ports:
          - containerPort: 8086
            name: influxdb
      - name: sawtooth-stats-grafana
        image: kodonnel/sawtooth-stats-grafana:btp-1-0-staging-01
        ports:
          - containerPort: 3000
            name: grafana
`
}

module.exports = {
  GrafanaService,
  InfluxDBService,
  StatefulSet,
}