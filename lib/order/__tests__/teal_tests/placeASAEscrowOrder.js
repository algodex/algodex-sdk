/* eslint-disable */
const testHelper = require('../setup.js');
const transactionGenerator = require('../GenerateTransactionTypes');
const algosdk = require('algosdk');

const PRINT_TXNS = 0;

const Test = {
  runTest: async function (
    config,
    asaAmount,
    price,
    optIn,
    returnOuterTransactions
  ) {
    console.log('STARTING placeASAEscrowOrder test');
    const client = config.client;

    const creatorAccount = config.creatorAccount.addr;
    const wallet = {
      type: 'sdk',
      address: config.creatorAccount.addr,
      connector: {
        ...config.connector,
        sk: config.creatorAccount.sk,
        connected: true,
      },
      // mnemonic: config.creatorAccount.sk,
    };

    const order = {
      asset: {
        id: config.assetId,
        decimals: 6,
      },
      address: creatorAccount,
      price: price,
      amount: asaAmount,
      total: price * asaAmount,
      type: 'sell',
      client: config.client,
      execution: 'maker',
      wallet: wallet,
    };

    const outerTxns = await transactionGenerator.getPlaceASAEscrowOrderTxns(
      order,
      optIn
    );
    debugger;

    if (returnOuterTransactions) {
      return outerTxns;
    }
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

    await testHelper.sendAndCheckConfirmed(client, signedTxns);

    return true;
  },
  getOuterTransactions: async function (config) {
    const outerTxns = await this.runTest(config, 200000, 1.2, true);
    return outerTxns;
  },

  runGroupSizeWrongTest: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns.push({
      unsignedTxn: await transactionGenerator.getPayTxn(
        client,
        lsig.address(),
        maliciousAccount.addr,
        1000,
        false
      ),
      lsig: lsig,
    });

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runGroupSizeWrongTest2: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns.push({
      unsignedTxn: await transactionGenerator.getPayTxn(
        client,
        maliciousAccount.addr,
        maliciousAccount.addr,
        1000,
        false
      ),
      senderAcct: maliciousAccount,
    });

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runPayAmountTooLowTest: async function (config, skipASAOptIn = false) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns[0].unsignedTxn.amount = 400000;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAppOptInMissingTest: async function (config, skipASAOptIn = false) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns[1] = {
      unsignedTxn: await transactionGenerator.getPayTxn(
        client,
        maliciousAccount.addr,
        maliciousAccount.addr,
        1000,
        false
      ),
      senderAcct: maliciousAccount,
    };

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAssetIdWrongTest: async function (config, skipASAOptIn = false) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns[3].unsignedTxn.assetIndex = 19026; // change to wrong asset id

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAssetAmountZeroTest: async function (config, skipASAOptIn = false) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns[3].unsignedTxn.amount = 0;
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAssetRecipientWrongTest: async function (config, skipASAOptIn = false) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns[3].unsignedTxn.to = algosdk.decodeAddress(maliciousAccount.addr);
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },
};
module.exports = Test;
