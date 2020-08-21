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
      charts: ["sawtooth"],
    },
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: "btp-unstable/sawtooth", extension: "sawtooth" },
    },
  },
};

module.exports = {
  edition,
};
