const ExternalService = ({ clusterSettings }) => {
  const domainName = `next.${ clusterSettings.name }.${ clusterSettings.domain }`
  return `apiVersion: v1
kind: Service
metadata:
  name: sawtooth-next-external
  labels:
    app: sawtooth-next
    dns: route53
  annotations:
    domainName: "${ domainName }"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    protocol: TCP
    targetPort: 4200
    name: rbac-ui
  selector:
    app: sawtooth-next
`
}

const RbacService = ({ clusterSettings }) => {
  return `apiVersion: v1
kind: Service
metadata:
  name: sawtooth-next
  labels:
    app: sawtooth-next
spec:
  ports:
  - port: 9090
    protocol: TCP
    targetPort: 8080
    name: rethinkdb-admin
  - port: 4200
    protocol: TCP
    targetPort: 4200
    name: rbac-ui
  selector:
    app: sawtooth-next
`
}

const StatefulSet = ({ clusterSettings }) => {
  return `apiVersion: apps/v1
kind: StatefulSet 
metadata:
  name: sawtooth-next
  labels:
    app: sawtooth-next
spec:
  selector:
    matchLabels:
      app: sawtooth-next
  serviceName: "sawtooth-next"
  template:
    metadata:
      labels:
        app: sawtooth-next
    spec:
      containers:
      - name: rethinkdb 
        image: library/rethinkdb:2.3
        command: [ "rethinkdb", "--bind", "all" ]
        ports:
          - containerPort: 8080
            name: rethinkdb-admin
          - containerPort: 28015
            name: rethinkdb
      - name: rbac-server
        image: blockchaintp/rbac-server-production:develop
        command: [ "bash", "-c" ]
        args:
          - |
            ln -s /project/tmobile-rbac/etc/config.py /project/tmobile-rbac/server/config.py;
            bin/rbac-server
        volumeMounts:
        - name: rbac-config-volume
          mountPath: /project/tmobile-rbac/server/config.py
          subPath: config.py
      - name: rbac-ledger-sync
        image: blockchaintp/rbac-ledger-sync-production:develop
        command: [ "bash", "-c" ]
        args:
          - |
            bin/setup_db --host localhost &&
            bin/rbac-ledger-sync -v \
              --db-host localhost \
              --validator tcp://sawtooth-validator:4004
      - name: rbac-ui
        image: blockchaintp/rbac-ui-production:develop
        ports:
          - containerPort: 4200
            name: rbac-ui
        env:
          - name: RBAC_SERVER
            value: "localhost" 
      volumes:
        - name: rbac-config-volume
          configMap:
            name: rbac-config
`
}

module.exports = {
  ExternalService,
  RbacService,
  StatefulSet,
}