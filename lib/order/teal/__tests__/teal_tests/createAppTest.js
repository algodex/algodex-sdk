const algosdk = require('algosdk');
const logger = require('../../../../logger');
const {
  transferFunds,
  transferASA,
  waitForConfirmation,
  getAccountInfo,
  test: {blankProgramSource},
} = require('../../../../teal');
const txns = require('../../../txns');
const Test = {
  /**
   *
   * @param {TestConfig} config
   * @param type
   * @param optIntoASAForExecutor
   * @return {Promise<*>}
   */
  async runTest(config, type='buy', optIntoASAForExecutor = true) {
    logger.debug('STARTING createAppTest: ', {type} );
    const client = config.client;
    const openAccount = config.openAccount;
    const maliciousAccount = config.maliciousAccount;
    const creatorAccount = config.creatorAccount;
    const executorAccount = config.executorAccount;

    logger.debug('starting the test');

    await transferFunds(client, openAccount, creatorAccount, 5000000); // 5 algos
    await transferFunds(client, openAccount, executorAccount, 5000000); // 5 algos
    await transferASA(client, creatorAccount, creatorAccount, 0, config.assetIndex); // opt in transaction
    await transferASA(client, openAccount, creatorAccount, 2000000, config.assetIndex); // 5 algos
    if (optIntoASAForExecutor) {
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
    logger.debug('txID: ' + txId);

    // Sign the transaction

    const signedTxn = createTxn.signTxn(creatorAccount.sk);
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
    logger.debug('Created new app-id: ', appId);
    const accountInfo = await client.accountInformation(creatorAccount.addr).do();
    logger.debug( 'amount: ', accountInfo.amount );

    return appId;
  },
  async createFakeApp(config) {
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
  },
};
module.exports = Test;
