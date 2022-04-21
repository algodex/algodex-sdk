const algosdk = require('algosdk');
const {transferFunds, transferASA} = require('../../teal/utils');
const txns = require('../txns');

/**
 *
 * @param {TestConfig} config Test Configuration
 * @param {'buy'|'sell'} type Type of Order
 * @param {boolean} [optIn] Opt In
 * @return {Promise<any>}
 */
async function createApp(config, type, optIn = false) {
  const {client, openAccount, maliciousAccount, creatorAccount, executorAccount} = config;

  if (typeof type !== 'string' || !['buy', 'sell'].includes(type)) {
    throw new TypeError('Must have valid type!');
  }


  await transferFunds(client, openAccount, creatorAccount, 5000000); // 5 algos
  await transferFunds(client, openAccount, executorAccount, 5000000); // 5 algos
  await transferASA(client, creatorAccount, creatorAccount, 0, config.assetIndex); // opt in transaction
  await transferASA(client, openAccount, creatorAccount, 2000000, config.assetIndex); // 5 algos

  if (optIn) {
    await transferASA(client, executorAccount, executorAccount, 0, config.assetIndex); // opt in transaction
    await transferASA(client, openAccount, executorAccount, 2000000, config.assetIndex); // 5 algos
  }

  await transferFunds(client, openAccount, maliciousAccount, 5000000); // 5 algos
  await transferASA(client, maliciousAccount, maliciousAccount, 0, config.assetIndex); // opt in transaction
  await transferASA(client, openAccount, maliciousAccount, 2000000, config.assetIndex); // 5 algos

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
  return transactionResponse['application-index'];
}

module.exports = createApp;
