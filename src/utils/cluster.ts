/* eslint-disable camelcase */
/*

  extract the cluster secrets from the desired state
  this is so we never save secrets inside of tasks or cluster records
  they are only saved in the clustersecret store (which can be replaced later)
  the desired_state of the cluster will hold a reference to the id of the secret

  will return an object with these props:

    * desired_state - the desired_state with the secrets extracted
    * secrets - an object of name onto an object with either base64Data or rawData

*/
export function extractClusterSecrets({
  desired_state,
}: {
  desired_state: {
    [key: string]: unknown
  }
}) {
  const secrets: {
    [key: string]: unknown
  } = {}

  if (!desired_state) {
    return {
      desired_state,
      secrets,
    }
  }

  const returnDesiredState = { ...desired_state }

  if (returnDesiredState.token) {
    secrets.token = {
      rawData: returnDesiredState.token,
    }
    delete returnDesiredState.token
  }

  if (returnDesiredState.ca) {
    secrets.ca = {
      rawData: returnDesiredState.ca,
    }
    delete returnDesiredState.ca
  }

  return {
    desired_state: returnDesiredState,
    secrets,
  }
}
