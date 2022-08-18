/* eslint-disable */
const testHelper = require('../setup.js');
const transactionGenerator = require('../GenerateTransactionTypes');
const algosdk = require('algosdk');
const signer = require('../../../wallet/signers/AlgoSDK');
const _sendTransactions = require('./sendTransactions');
const PRINT_TXNS = 0;

const Test = {
  runTest: async function (
    config,
    price,
    asaAmount,
    returnOuterTransactions = false
  ) {
    // console.log('STARTING close asa escrow order test');
    // const client = config.client;
    // const creatorAccount = config.creatorAccount;
    // const assetId = config.assetId;
    // const appId = config.appId;
    // console.log('creator account is: ' + creatorAccount.addr);
    console.log('STARTING placeASAEscrowOrder test');
    const client = config.client;

    const creatorAccount = config.creatorAccount.addr;
    const wallet = {
      type: 'sdk',
      address: config.creatorAccount.addr,
      connector: {
        ...config.connector,
        sk: config.creatorAccount.sk, //Just in case we want to test signing and sending from the api and not from the tests.
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
      execution: 'close',
      wallet: wallet,
    };

    const closeASAEscrowOrder =
      await transactionGenerator.getCloseASAEscrowOrderTxns(order);

    if (returnOuterTransactions) {
      return outerTxns;
    }
    const signedTxns = await signer(
      [closeASAEscrowOrder],
      config.creatorAccount.sk
    );

    const confirmation = await _sendTransactions(client, signedTxns);

    return true;
  },

  getOuterTransactions: async function (config) {
    const outerTxns = await this.runTest(config, 1.45, true);
    return outerTxns;
  },

  runGroupSizeWrongTest: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[0].lsig;

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

    const lsig = outerTxns[0].lsig;

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

  appCallMissing: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[0] = {
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

  appCallMissing2: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[0].unsignedTxn.appOnComplete = 0; // change to noop

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  appCallWrongSender: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[0].unsignedTxn.from = algosdk.decodeAddress(
      maliciousAccount.addr
    );

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runASAWrongAddrCloseToTest: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[1].unsignedTxn.closeRemainderTo = algosdk.decodeAddress(
      maliciousAccount.addr
    );

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoWrongAddrCloseToTest: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[2].unsignedTxn.closeRemainderTo = algosdk.decodeAddress(
      maliciousAccount.addr
    );

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runASACloseToTxnHasNonZeroAmount: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[1].unsignedTxn.amount = 1000;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoCloseToTxnHasNonZeroAmount: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[2].unsignedTxn.amount = 1000;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runWrongOwnerProofTest: async function (config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[3].unsignedTxn.from = algosdk.decodeAddress(
      maliciousAccount.addr
    );

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
