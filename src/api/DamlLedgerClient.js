"use strict";
// Copyright (c) 2020 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/*

  This is a monkey-patched version of the deprecated: https://github.com/digital-asset/daml-js

  this patch allows us to pass a JWT token into the GRPC connection by adding
  an "Authoriation: Bearer <token>" entry to the metadata

*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DamlLedgerClient = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
const Callback_1 = require("@digitalasset/daml-ledger/lib/util/Callback");
const HumanReadableReporter_1 = require("@digitalasset/daml-ledger/lib/reporting/HumanReadableReporter");
const NodeJsResetClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsResetClient");
const NodeJsPackageClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsPackageClient");
const NodeJsLedgerIdentityClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsLedgerIdentityClient");
const NodeJsCommandSubmissionClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsCommandSubmissionClient");
const NodeJsPartyManagementClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsPartyManagementClient");
const NodeJsPackageManagementClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsPackageManagementClient");
const ledgerIdentityService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/ledger_identity_service_grpc_pb");
const partyManagementService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/admin/party_management_service_grpc_pb");
const packageManagementService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/admin/package_management_service_grpc_pb");
const ledger_identity_service_pb_1 = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/ledger_identity_service_pb");
const activeContractsService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/active_contracts_service_grpc_pb");
const commandService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/command_service_grpc_pb");
const commandCompletionService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/command_completion_service_grpc_pb");
const commandSubmissionService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/command_submission_service_grpc_pb");
const packageService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/package_service_grpc_pb");
const ledgerConfigurationService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/ledger_configuration_service_grpc_pb");
const timeService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/testing/time_service_grpc_pb");
const transactionService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/transaction_service_grpc_pb");
const resetService = require("@digitalasset/daml-ledger/lib/generated/com/daml/ledger/api/v1/testing/reset_service_grpc_pb");
const NodeJsCommandClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsCommandClient");
const NodeJsActiveContractsClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsActiveContractsClient");
const NodeJsCommandCompletionClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsCommandCompletionClient");
const NodeJsLedgerConfigurationClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsLedgerConfigurationClient");
const util_1 = require("util");
const NodeJsTimeClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsTimeClient");
const NodeJsTransactionClient_1 = require("@digitalasset/daml-ledger/lib/client/NodeJsTransactionClient");
/**
 * A {@link LedgerClient} implementation that connects to an existing Ledger and provides clients to query it. To use the {@link DamlLedgerClient}
 * call the static `connect` method, passing an instance of {@link LedgerClientOptions} with the host, port and (for secure connection) the
 * necessary certificates.
 */
class DamlLedgerClient {
    constructor(ledgerId, address, credentials, reporter, grpcOptions) {
        this.ledgerId = ledgerId;
        this._activeContractsClient = new NodeJsActiveContractsClient_1.NodeJsActiveContractsClient(ledgerId, new DamlLedgerClient.ActiveContractsServiceClient(address, credentials, grpcOptions), reporter);
        this._commandClient = new NodeJsCommandClient_1.NodeJsCommandClient(ledgerId, new DamlLedgerClient.CommandServiceClient(address, credentials, grpcOptions), reporter);
        this._commandCompletionClient = new NodeJsCommandCompletionClient_1.NodeJsCommandCompletionClient(ledgerId, new DamlLedgerClient.CommandCompletionServiceClient(address, credentials, grpcOptions), reporter);
        this._commandSubmissionClient = new NodeJsCommandSubmissionClient_1.NodeJsCommandSubmissionClient(ledgerId, new DamlLedgerClient.CommandSubmissionServiceClient(address, credentials, grpcOptions), reporter);
        this._ledgerIdentityClient = new NodeJsLedgerIdentityClient_1.NodeJsLedgerIdentityClient(new DamlLedgerClient.LedgerIdentityServiceClient(address, credentials, grpcOptions));
        this._packageClient = new NodeJsPackageClient_1.NodeJsPackageClient(ledgerId, new DamlLedgerClient.PackageServiceClient(address, credentials, grpcOptions));
        this._ledgerConfigurationClient = new NodeJsLedgerConfigurationClient_1.NodeJsLedgerConfigurationClient(ledgerId, new DamlLedgerClient.LedgerConfigurationServiceClient(address, credentials, grpcOptions));
        this._timeClient = new NodeJsTimeClient_1.NodeJsTimeClient(ledgerId, new DamlLedgerClient.TimeServiceClient(address, credentials, grpcOptions), reporter);
        this._transactionClient = new NodeJsTransactionClient_1.NodeJsTransactionClient(ledgerId, new DamlLedgerClient.TransactionServiceClient(address, credentials, grpcOptions), reporter);
        this._resetClient = new NodeJsResetClient_1.NodeJsResetClient(ledgerId, new DamlLedgerClient.ResetServiceClient(address, credentials, grpcOptions));
        this._partyManagementClient = new NodeJsPartyManagementClient_1.NodeJsPartyManagementClient(new DamlLedgerClient.PartyManagementServiceClient(address, credentials, grpcOptions), reporter);
        this._packageManagementClient = new NodeJsPackageManagementClient_1.NodeJsPackageManagementClient(new DamlLedgerClient.PackageManagementServiceClient(address, credentials, grpcOptions), reporter);
    }
    get activeContractsClient() {
        return this._activeContractsClient;
    }
    get commandClient() {
        return this._commandClient;
    }
    get commandCompletionClient() {
        return this._commandCompletionClient;
    }
    get commandSubmissionClient() {
        return this._commandSubmissionClient;
    }
    get ledgerIdentityClient() {
        return this._ledgerIdentityClient;
    }
    get packageClient() {
        return this._packageClient;
    }
    get ledgerConfigurationClient() {
        return this._ledgerConfigurationClient;
    }
    get timeClient() {
        return this._timeClient;
    }
    get transactionClient() {
        return this._transactionClient;
    }
    get resetClient() {
        return this._resetClient;
    }
    get partyManagementClient() {
        return this._partyManagementClient;
    }
    get packageManagementClient() {
        return this._packageManagementClient;
    }
    static connectCallback(options, callback) {
        let creds;
        if (!options.certChain && !options.privateKey && !options.rootCerts) {
            creds = grpc_js_1.credentials.createInsecure();
        }
        else if (options.certChain && options.privateKey && options.rootCerts) {
            creds = grpc_js_1.credentials.createSsl(options.rootCerts, options.privateKey, options.certChain);
        }
        else {
            setImmediate(() => {
                callback(new Error(`Incomplete information provided to establish a secure connection (certChain: ${!!options.certChain}, privateKey: ${!!options.privateKey}, rootCerts: ${!!options.rootCerts})`));
            });
            return;
        }
        // this is where we inject the token (if given)
        // we "combine" the credentials injecting the metadata
        // (with auth) into the existing (TLS or not) creds
        if(options.jwtToken) {
          creds = grpc_js_1.credentials.combineChannelCredentials(
            creds,
            grpc_js_1.credentials.createFromMetadataGenerator((params, callback) => {
              const metadata = new grpc_js_1.Metadata()
              metadata.set('authorization', 'Bearer ' + options.jwtToken)
              return callback(null, metadata)
            })
          )
        }
        const reporter = options.reporter || HumanReadableReporter_1.HumanReadableReporter;
        const address = `${options.host}:${options.port}`;
        const client = new DamlLedgerClient.LedgerIdentityServiceClient(address, creds);
        client.getLedgerIdentity(new ledger_identity_service_pb_1.GetLedgerIdentityRequest(), (error, response) => {
            Callback_1.forward(callback, error, response, response => {
                return new DamlLedgerClient(response.getLedgerId(), address, creds, reporter, options.grpcOptions);
            });
        });
    }
    static connect(options, callback) {
        return callback ? DamlLedgerClient.connectCallback(options, callback) : DamlLedgerClient.connectPromise(options);
    }
}
exports.DamlLedgerClient = DamlLedgerClient;
DamlLedgerClient.LedgerIdentityServiceClient = grpc_js_1.makeClientConstructor(ledgerIdentityService['com.daml.ledger.api.v1.LedgerIdentityService'], 'LedgerIdentityService');
DamlLedgerClient.ActiveContractsServiceClient = grpc_js_1.makeClientConstructor(activeContractsService['com.daml.ledger.api.v1.ActiveContractsService'], 'ActiveContractsService');
DamlLedgerClient.CommandServiceClient = grpc_js_1.makeClientConstructor(commandService['com.daml.ledger.api.v1.CommandService'], 'CommandService');
DamlLedgerClient.CommandCompletionServiceClient = grpc_js_1.makeClientConstructor(commandCompletionService['com.daml.ledger.api.v1.CommandCompletionService'], 'CommandCompletionService');
DamlLedgerClient.CommandSubmissionServiceClient = grpc_js_1.makeClientConstructor(commandSubmissionService['com.daml.ledger.api.v1.CommandSubmissionService'], 'CommandSubmissionService');
DamlLedgerClient.PackageServiceClient = grpc_js_1.makeClientConstructor(packageService['com.daml.ledger.api.v1.PackageService'], 'PackageService');
DamlLedgerClient.LedgerConfigurationServiceClient = grpc_js_1.makeClientConstructor(ledgerConfigurationService['com.daml.ledger.api.v1.LedgerConfigurationService'], 'LedgerConfigurationService');
DamlLedgerClient.TimeServiceClient = grpc_js_1.makeClientConstructor(timeService['com.daml.ledger.api.v1.testing.TimeService'], 'TimeService');
DamlLedgerClient.TransactionServiceClient = grpc_js_1.makeClientConstructor(transactionService['com.daml.ledger.api.v1.TransactionService'], 'TransactionService');
DamlLedgerClient.ResetServiceClient = grpc_js_1.makeClientConstructor(resetService['com.daml.ledger.api.v1.testing.ResetService'], 'ResetService');
DamlLedgerClient.PartyManagementServiceClient = grpc_js_1.makeClientConstructor(partyManagementService['com.daml.ledger.api.v1.admin.PartyManagementService'], 'PartyManagementService');
DamlLedgerClient.PackageManagementServiceClient = grpc_js_1.makeClientConstructor(packageManagementService['com.daml.ledger.api.v1.admin.PackageManagementService'], 'PackageManagementService');
DamlLedgerClient.connectPromise = util_1.promisify(DamlLedgerClient.connectCallback);
//# sourceMappingURL=DamlLedgerClient.js.map