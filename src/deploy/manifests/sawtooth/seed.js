const RestApiService = ({ clusterSettings }) => {
  const domainName = `rest.${ clusterSettings.name }.${ clusterSettings.domain }`
  return `apiVersion: v1
kind: Service
metadata:
  name: sawtooth-rest-api
  labels:
    app: sawtooth-validator
    dns: route53
  annotations:
    domainName: "${ domainName }"
spec:
  type: LoadBalancer
  ports:
  - port: 8080
    protocol: TCP 
    targetPort: 8080
  selector:
    app: sawtooth-validator
`
}

const ValidatorService = ({ clusterSettings }) => {
  return `apiVersion: v1
kind: Service
metadata:
  name: sawtooth-validator
  labels:
    app: sawtooth-validator
spec:
  ports:
  - port: 8800
    protocol: TCP 
    targetPort: 8800
    name: sawnet
  - port: 4004
    protocol: TCP 
    targetPort: 4004
    name: sawcomp
  clusterIP: None
  selector:
    app: sawtooth-validator
`
}

const StatefulSet = ({ clusterSettings }) => {
  const replicas = clusterSettings.node_count
  return `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: sawtooth-validator
spec:
  selector:
    matchLabels:
      app: sawtooth-validator
  serviceName: "sawtooth-validator"
  podManagementPolicy: Parallel
  replicas: ${ replicas }
  template:
    metadata:
      labels:
        app: sawtooth-validator
    spec:
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: "app"
                    operator: In
                    values:
                    - sawtooth-validator
              topologyKey: "kubernetes.io/hostname"
      containers:
      - name: sawtooth-validator
        image: blockchaintp/sawtooth-validator:1.0.5
        command: ["bash", "-c" ]
        args:
          #- "sleep 3600"
          - |
            sleep 30;
            apt update; apt install host -y;
            for ip in \`host sawtooth-validator|awk '{print $NF}'\`; do
              export SEEDS="-s tcp://$ip:8800 $SEEDS";
            done;
            sawtooth-validator -v --scheduler \${SCHEDULER} \\
              --endpoint tcp://\${ENDPOINT_ADDRESS}:8800 \\
              --bind component:tcp://0.0.0.0:4004 \\
              --bind network:tcp://0.0.0.0:8800 \\
              -P dynamic \\
              --network-auth trust \\
              --minimum-peer-connectivity \${MINIMUM_PEERS} \\
              --maximum-peer-connectivity 255 \\
              --opentsdb-url http://influxdb:8086 \\
              --opentsdb-db metrics \\
              \${SEEDS} ;
        volumeMounts:
        - mountPath: "/etc/sawtooth"
          name: sawtooth
        env:
          - name: ENDPOINT_ADDRESS
            valueFrom:
              fieldRef:
                fieldPath: status.podIP
          - name: SCHEDULER
            value: "parallel"
          - name: MINIMUM_PEERS
            value: "3"
        ports:
          - containerPort: 4004
            name: sawcomp
          - containerPort: 8800
            name: sawnet
          - containerPort: 5050
            name: consensus
      - name: settings-tp
        image: blockchaintp/sawtooth-settings-tp:1.0.5
        command: [ "bash", "-c"]
        args: 
          - "settings-tp -v --connect tcp://localhost:4004"
      - name: identity-tp
        image: blockchaintp/sawtooth-identity-tp:1.0.5
        command: [ "bash", "-c"]
        args: 
          - "identity-tp -v --connect tcp://localhost:4004"
      - name: block-info-tp
        image: blockchaintp/sawtooth-block-info-tp:1.0.5
        command: [ "bash", "-c"]
        args: 
          - "block-info-tp -v --connect tcp://localhost:4004"
      - name: poet-validator-registry-tp
        image: blockchaintp/sawtooth-poet-validator-registry-tp:1.0.5
        command: [ "bash", "-c"]
        args: 
          - "poet-validator-registry-tp -v --connect tcp://localhost:4004"
      - name: smallbank-tp
        image: blockchaintp/sawtooth-smallbank-tp-go:1.0.5
        command: [ "bash", "-c"]
        args: 
          - "smallbank-tp-go -v --connect tcp://localhost:4004"
      - name: rbac-tp
        image: blockchaintp/rbac-tp-production:develop
        command: [ "bash", "-c"]
        args: 
          - "bin/rbac-tp -v tcp://localhost:4004"
      - name: simple-tp-python
        image: blockchaintp/simple-tp-python:latest
        command: [ "bash", "-c"]
        args: 
          - |  
            ( set -x ; apt update;
            apt install git -y
            cd /; 
            git clone https://github.com/catenasys/caliper; 
            cd caliper; 
            git fetch --all;
            git checkout sawtooth-testing ; 
            cd /; 
            mv caliper project; 
            /project/caliper/src/contract/sawtooth/simple/simple_python/simple-tp-python -vv -C tcp://localhost:4004 )
      - name: rest-api
        image: blockchaintp/sawtooth-rest-api:1.0.5
        command: [ "bash", "-c"]
        args: 
          - "sawtooth-rest-api -v --bind 0.0.0.0:8080 --connect tcp://localhost:4004"
        ports:
          - containerPort: 8080
            name: sawrest
      initContainers:
      - name: install
        image: blockchaintp/sawtooth-validator:1.0.5
        command: [ "bash", "-xc" ]
        args: 
          - |
            if [ ! -r /etc/sawtooth/initialized ]; then
              set -x
              mkdir -p /etc/sawtooth/keys;
              mkdir -p /etc/sawtooth/data;
              rm -rf /var/lib/sawtooth;
              ln -s /etc/sawtooth/data /var/lib/sawtooth
              sawadm keygen --force;
              sawtooth keygen --force ;
              if [ "\${POD_NAME}" = "sawtooth-validator-0" ]; then
                mkdir -p /etc/sawtooth/genesis;
                apt update
                apt install curl -y
                curl https://raw.githubusercontent.com/hyperledger/sawtooth-core/5094a9a1a7d086c14704e7055cfad9de77d1e6aa/consensus/poet/simulator/packaging/simulator_rk_pub.pem > /etc/sawtooth/keys/simulator_rk_pub.pem
                sawset genesis -k /etc/sawtooth/keys/validator.priv -o /etc/sawtooth/genesis/genesis.batch ;
                sawset proposal create -k /etc/sawtooth/keys/validator.priv \\
                  sawtooth.consensus.algorithm=poet \\
                  sawtooth.poet.report_public_key_pem="$(cat /etc/sawtooth/keys/simulator_rk_pub.pem)" \\
                  sawtooth.poet.valid_enclave_measurements=$(poet enclave --enclave-module simulator measurement) \\
                  sawtooth.poet.valid_enclave_basenames=$(poet enclave --enclave-module \${MODULE:-simulator} basename) \\
                  sawtooth.validator.batch_injectors=block_info \\
                  -o /etc/sawtooth/genesis/config.batch;
                poet registration create -k /etc/sawtooth/keys/validator.priv \\
                  --enclave-module simulator \\
                  -o /etc/sawtooth/genesis/poet.batch
                sawset proposal create -k /etc/sawtooth/keys/validator.priv \\
                  sawtooth.poet.target_wait_time=30 \\
                  sawtooth.poet.initial_wait_time=25 \\
                  sawtooth.publisher.max_batches_per_block=100 \\
                  -o /etc/sawtooth/genesis/poet-settings.batch
                sawadm genesis /etc/sawtooth/genesis/genesis.batch \\
                  /etc/sawtooth/genesis/config.batch \\
                  /etc/sawtooth/genesis/poet.batch \\
                  /etc/sawtooth/genesis/poet-settings.batch
              fi
              echo 'data_dir = "/etc/sawtooth/data"' > /etc/sawtooth/path.toml
              touch /etc/sawtooth/initialized;
            fi
        env:
          - name: POD_NAME
            valueFrom:
              fieldRef:
                fieldPath: metadata.name
        volumeMounts:
        - mountPath: "/etc/sawtooth"
          name: sawtooth
  volumeClaimTemplates:
  - metadata:
      name: sawtooth
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "fast-keep"
      resources:
        requests:
          storage: 10Gi
`
}

module.exports = {
  RestApiService,
  ValidatorService,
  StatefulSet,
}