Now:

 * add the registry credentials UI
 * add the affinity rules UI
 * Include the sextant public key in the list with the name `sextant`

Future:

 * add the hostpath base directory to 1.1 (don't add to UI)
 * edit the image addresses for fixed TPs

Done:

 * correct the get credentials script with the jsonpath error
 * loose the link highlighting on the service external IP
 * use the `build` icon for deployment settings button
 * `Keys` tab -> `Permissions`
   * `Local Cluster Keys` -> `Local Keys`
   * `Global Enrolled Keys` -> `Allowed Keys`
 * fix the error when adding an allowed key
 * change column header from `Key` -> `Public Key` - always use public key everywhere
 * fix bug where removing the parties removed all parties
 * order local participants before remote ones in the `All Parties By Participant`
 * add a `.dar` filter to the dropzone on package uploads
 * add the DAML enabled to 1.1

KeyManager request:

 * payload - blob
 * payload_signature - signature of signed payload with privateKey
 * publicKey - of the keypair

```
const signature = signer.sign(payload)
```

Settings TP transaction - signed with sextant private key

DamlRPC - GRPC