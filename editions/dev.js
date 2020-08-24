// Edition object for dev mode
const dotenv = require("dotenv");

dotenv.config();

const edition = {
  deployment: {
    classic: ["daml", "taekion"],
    helm: ["sawtooth"],
  },
  metering: {
    type: "dev",
  },
  helmRepos: [
    {
      name: "btp-unstable",
      url: "https://btp-charts-unstable.s3.amazonaws.com/charts",
      charts: ["sawtooth","daml-on-besu"],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: "btp-unstable/sawtooth", extension: "sawtooth" },
    },
    daml: {
      "daml-on-besu": { chart: "btp-unstable/daml-on-besu", extension: "daml" },
    }
  },
};

module.exports = {
  edition,
};
