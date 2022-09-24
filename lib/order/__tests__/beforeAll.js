/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const txns = require('../txns');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const initAccounts = require('../../teal/test/initAccounts');
const logger = require('../../logger');
/**
 *
 * @param {TestConfig} config Test Configuration
 * @param {'buy'|'sell'} type Type of Order
 * @param {boolean} [optIn] Opt In
 * @param {boolean} [newCreator] create new creator account
 * @return {Promise<any>}
 */
async function beforeAll(config, type, optIn = false, newCreator = false) {
  logger.info({type, optIn, newCreator}, `order.test.beforeAll()`);
  if (typeof type !== 'string' || !['buy', 'sell'].includes(type)) {
    throw new TypeError('Must have valid type!');
  }

  // Initalize API Client
  await config.init(AlgodexApi, [apiConfig]);

  // Initialize Accounts and Configuration
  await initAccounts(config, optIn, newCreator);

  const {client, creatorAccount} = config;
  const createTxn = await txns.makeApplicationCreateTxn(
      client,
      type,
      creatorAccount,
      config.suggestedParams,
  );
  const txId = createTxn.txID().toString();

  const signedTxn = createTxn.signTxn(creatorAccount.sk);

  await client.sendRawTransaction(signedTxn).do();

  // Wait for confirmation
  await algosdk.waitForConfirmation(client, txId, 10);

  // display results
  const transactionResponse = await client.pendingTransactionInformation(txId).do();

  config.setAppIndex(transactionResponse['application-index']);
}

module.exports = beforeAll;
