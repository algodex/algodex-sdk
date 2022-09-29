/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const txns = require('../txns');
const logger = require('../../logger');
const algosdk = require('algosdk');
const {getAccountInfo, test: {blankProgramSource}} = require('../../teal');

// eslint-disable-next-line require-jsdoc
async function createFakeApp(config) {
  const client = config.client;
  const from = config.creatorAccount;

  const createTxn = await txns.makeApplicationCreateTxn(
      client,
      'buy',
      from,
      config.suggestedParams,
      undefined,
      blankProgramSource,
  );
  const txId = createTxn.txID().toString();
  logger.debug('txID: ' + txId);

  // Sign the transaction

  const signedTxn = createTxn.signTxn(from.sk);
  logger.debug('Signed transaction with txID: %s', txId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedTxn).do();
  } catch (e) {
    logger.debug(JSON.stringify(e));
  }

  // Wait for confirmation
  await algosdk.waitForConfirmation(client, txId, 10);

  // display results
  const transactionResponse = await client.pendingTransactionInformation(txId).do();
  const appId = transactionResponse['application-index'];
  logger.debug('Created new fake app-id: ', appId);

  const accountInfo = await getAccountInfo(from.addr);
  logger.debug( 'amount: ', accountInfo.amount );

  return appId;
}

module.exports = createFakeApp;
