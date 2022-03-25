const testHelper = require('../setup.js');
const transactionGenerator = require('../../lib/teal/generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
  async runTest(config, isAlgoEscrowApp = true, optIntoASAForExecutor = true) {
    console.log('STARTING createAppTest: ', {isAlgoEscrowApp} );
    const client = config.client;
    const openAccount = config.openAccount;
    const maliciousAccount = config.maliciousAccount;
    const creatorAccount = config.creatorAccount;
    const executorAccount = config.executorAccount;

    console.log('starting the test');

    await testHelper.transferFunds(client, openAccount, creatorAccount, 5000000); // 5 algos
    await testHelper.transferFunds(client, openAccount, executorAccount, 5000000); // 5 algos
    await testHelper.transferASA(client, creatorAccount, creatorAccount, 0, config.assetId); // opt in transaction
    await testHelper.transferASA(client, openAccount, creatorAccount, 2000000, config.assetId); // 5 algos
    if (optIntoASAForExecutor) {
      await testHelper.transferASA(client, executorAccount, executorAccount, 0, config.assetId); // opt in transaction
      await testHelper.transferASA(client, openAccount, executorAccount, 2000000, config.assetId); // 5 algos
    }

    await testHelper.transferFunds(client, openAccount, maliciousAccount, 5000000); // 5 algos
    await testHelper.transferASA(client, maliciousAccount, maliciousAccount, 0, config.assetId); // opt in transaction
    await testHelper.transferASA(client, openAccount, maliciousAccount, 2000000, config.assetId); // 5 algos

    const createTxn = await transactionGenerator.getCreateAppTxn(client, creatorAccount, isAlgoEscrowApp);
    const txId = createTxn.txID().toString();
    console.log('txID: ' + txId);

    // Sign the transaction

    const signedTxn = createTxn.signTxn(creatorAccount.sk);
    console.log('Signed transaction with txID: %s', txId);

    // Submit the transaction
    try {
      await client.sendRawTransaction(signedTxn).do();
    } catch (e) {
      console.log(JSON.stringify(e));
    }

    // Wait for confirmation
    await testHelper.waitForConfirmation(client, txId);

    // display results
    const transactionResponse = await client.pendingTransactionInformation(txId).do();
    const appId = transactionResponse['application-index'];
    console.log('Created new app-id: ', appId);

    const accountInfo = await testHelper.getAccountInfo(creatorAccount.addr);
    console.log( 'amount: ', accountInfo.amount );

    return appId;
  },
  async createFakeApp(config) {
    const client = config.client;
    const creatorAccount = config.creatorAccount;

    const createTxn = await transactionGenerator.getCreateAppTxn(client, creatorAccount, true, true);
    const txId = createTxn.txID().toString();
    console.log('txID: ' + txId);

    // Sign the transaction

    const signedTxn = createTxn.signTxn(creatorAccount.sk);
    console.log('Signed transaction with txID: %s', txId);

    // Submit the transaction
    try {
      await client.sendRawTransaction(signedTxn).do();
    } catch (e) {
      console.log(JSON.stringify(e));
    }

    // Wait for confirmation
    await testHelper.waitForConfirmation(client, txId);

    // display results
    const transactionResponse = await client.pendingTransactionInformation(txId).do();
    const appId = transactionResponse['application-index'];
    console.log('Created new fake app-id: ', appId);

    const accountInfo = await testHelper.getAccountInfo(creatorAccount.addr);
    console.log( 'amount: ', accountInfo.amount );

    return appId;
  },
};
module.exports = Test;
