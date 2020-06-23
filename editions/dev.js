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
      charts: ['sawtooth', /* 'daml-on-sawtooth', 'daml-on-postgres', 'daml-on-qldb' */]
    }
  ],
  // ******* we ought to think about how to include chart versions as well
  chartTable: {
    sawtooth: {
      1.1: { chart: 'btp-dev/sawtooth', extension: 'sawtooth' }
    },
    /*daml: {
      'daml-on-postgres': {chart: 'btp-dev/daml-on-postgres', exstension: 'daml-on-postgres'},
      'daml-on-qldb': 'btp-dev/daml-on-qldb',
      'daml-on-sawtooth': 'btp-dev/daml-on-sawtooth'
    }*/
  },

}

module.exports = {
  edition
}
