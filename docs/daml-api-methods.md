## DAML api methods

Functions that are used for the DAML ui section of the frontend.

All of these methods are defined in the `src/controllers/deployment.js` file.

### Keys

These methods deal with sawtooth keys both local and globally enrolled:

 * `getKeyManagerKeys` - list keys from all key manager services in the deployment
 * `getEnrolledKeys` - list globally enrolled keys for the sawtooth cluster
 * `addEnrolledKey` - add an enrolled key to the sawtooth cluster

### Participants

These methods deal with DAML participants - we combine the results from `getKeyManagerKeys` to determine which participants are local and which are remote:

 * `getParticipants` - list the global DAML participants
 * `registerParticipant` - regiater a global DAML participant
 * `rotateParticipantKey` - rotate the keypair for a local DAML participant

### Parties

Methods that deal with the parties that belong to local participants:

 * `addParty` - add a party to a local participant
 * `removeParties` - remove parties from a local participant
 * `generatePartyToken` - generate a JWT token for some parties of a local participant

### Archives

Handle listing and uploading DAR archives:

 * `getArchives` - list the globally uploaded DAML archives
 * `uploadArchive` - upload a new DAR file

### Time service

List info for the time service

 * `getTimeServiceInfo` - list the information for the time service

## Backend

We use three backend sources for the above methods:

 * `KeyManager` - the sextant key manager container that is running inside each validator pod
 * `SawtoothSettings` - the sawtooth settings TP
 * `DamlRPC` - the DAML RPC server

### Controller <-> Backends

The following is a breakdown of each controller method and how they interact with our backend sources.

#### getKeyManagerKeys -> key manager (read)

Loop over each pod in the deployment and use `kubectl port-forward` to communicate with that key manager directly.

Issue a `getKeys` request to each key manager and collate the results into a single list

#### getEnrolledKeys -> settings tp (read)

Read request to the sawtooth settings namespace to get a list of sawtooth enrolled keys.

#### addEnrolledKey -> settings tp (transaction)

Issue a transaction to the sawtooth settings TP to add a new enrolled key.

#### getParticipants -> daml rpc (read)

Read request to any of the DamlRPC servers to get a global list of participants

#### registerParticipant -> daml rpc (transaction)

Issue a transaction to a DamlRPC server with the participant public key

#### rotateParticipantKey -> key manager (write) -> daml rpc (transaction)

First - make a request to the key manager to rotate the keypair for a participant.

Then - issue a transaction to a DamlRPC server to update that participants public key.

#### addParty -> daml rpc (transaction)

Issue a transaction to a DamlRPC server to add the party

#### removeParties -> daml rpc (transaction)

Issue a transaction to a DamlRPC server to remove the parties

#### generatePartyToken -> key manager (write)

Make a request to the key manager to generate a JWT token for the parties.

#### getArchives -> daml rpc (read)

Read request to any of the DamlRPC servers to get a global list of archives.

#### uploadArchive -> daml rpc (transaction)

Issue a transaction to a DamlRPC server to upload the archive.

#### getTimeServiceInfo -> daml rpc (read)

Read request to any of the DamlRPC servers to get a global list of time service info.
