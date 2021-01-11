/* eslint-disable quote-props */
/* eslint-disable quotes */

// this is a pre-defined object that can be used for a new deployment request body

const desiredState = {
  "name": "orange",
  "deployment_type": "sawtooth",
  "deployment_version": "1.1",
  "desired_state": {
    "affinity": {
      "enabled": false,
    },
    "imagePullSecrets": {
      "enabled": false,
      "value": [],
    },
    "custom_yaml": "",
    "sawtooth": {
      "networkName": "orange",
      "namespace": "test",
      "dynamicPeering": false,
      "genesis": {
        "enabled": true,
        "seed": "zM24WEHu5QnUTVoF4VeqI4SJ",
      },
      "permissioned": false,
      "consensus": 400,
      "externalSeeds": [],
      "sabre": {
        "enabled": false,
      },
      "seth": {
        "enabled": false,
      },
      "xo": {
        "enabled": false,
      },
      "smallbank": {
        "enabled": false,
      },
      "customTPs": null,
    },
  },
}

module.exports = desiredState
