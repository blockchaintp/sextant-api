// Edition object for dev mode
const dotenv = require("dotenv");

dotenv.config();

const edition = {
  deployment: {
    classic: ["daml", "taekion"],
    helm: ["sawtooth", "openebs", "fluentd","elasticsearch","kibana","besu"],
  },
  metering: {
    type: "dev",
  },
  helmRepos: [
    {
      name: "btp-unstable",
      url: "https://btp-charts-unstable.s3.amazonaws.com/charts",
      charts: ["sawtooth","daml-on-besu","openebs","fluentd","elasticsearch","kibana","besu","daml-on-sawtooth"],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: "btp-unstable/sawtooth", extension: "sawtooth" },
    },
    daml: {
      "daml-on-besu": { chart: "btp-unstable/daml-on-besu", extension: "daml" },
      "daml-on-sawtooth": { chart: "btp-unstable/daml-on-sawtooth", extension: "daml" },
    },
    openebs: {
      2.0: { chart: "btp-unstable/openebs", extension: "openebs"},
    },
    fluentd: {
      1.11: { chart: "btp-unstable/fluentd", extension: "fluentd"},
    },
    elasticsearch: {
      7.9: { chart: "btp-unstable/elasticsearch", extension: "elasticsearch"},
    },
    kibana: {
      7.8: { chart: "btp-unstable/kibana", extension: "kibana"},
    },
    besu: {
      1.4: { chart: "btp-unstable/besu", extension: "besu"},
    }
  },
};

module.exports = {
  edition,
};
