// Edition object for dev mode
const dotenv = require("dotenv");
dotenv.config();

const edition = {
  deployment: {
    types: ['daml', 'sawtooth'] 
   },
  metering: {
    type: 'dev'
  },
  helmRepos: [
    {
      name: 'btp-dev',
      url: 'https://dev.catenasys.com/repository/catenasys-helm-dev/',
      username: process.env.BTP_DEV_USR,
      password: process.env.BTP_DEV_PSW,
      charts: ['sawtooth', ]
    }
  ],
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-dev/sawtooth', extension: 'sawtooth' }
    },
  },

}

module.exports = {
  edition
}
