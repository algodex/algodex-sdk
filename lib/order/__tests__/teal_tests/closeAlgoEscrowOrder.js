/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* eslint-disable */
const testHelper = require('../setup.js');
const transactionGenerator = require('../../lib/teal/generate_transaction_types.js');
const algosdk = require('algosdk');
const PRINT_TXNS = 0;

const Test = {
  runTest: async function(config, price, returnOuterTransactions = false) {
    console.log('STARTING close algo escrow order test');
    const client = config.client;
    const creatorAccount = config.creatorAccount;
    const assetId = config.assetId;
    const appId = config.appId;
    console.log('creator account is: ' + creatorAccount.addr);

    const outerTxns = await transactionGenerator.getCloseAlgoEscrowOrderTxns(client, creatorAccount, price, assetId, appId);

    if (returnOuterTransactions) {
      return outerTxns;
    }
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

    await testHelper.sendAndCheckConfirmed(client, signedTxns);

    return true;
  },

  getOuterTransactions: async function(config) {
    const outerTxns = await this.runTest(config, 1.2, true);
    return outerTxns;
  },

  runGroupSizeWrongTest: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[0].lsig;

    outerTxns.push( {
      unsignedTxn: await transactionGenerator.getPayTxn(client, lsig.address(), maliciousAccount.addr,
          1000, false),
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

  runGroupSizeWrongTest2: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[0].lsig;

    outerTxns.push( {
      unsignedTxn: await transactionGenerator.getPayTxn(client, maliciousAccount.addr, maliciousAccount.addr,
          1000, false),
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

  runAlgoWrongAddrCloseToTest: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[1].unsignedTxn.closeRemainderTo = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runCloseToTxnHasNonZeroAmount: async function(config) {
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

  runAlgoWrongOwnerProofTest: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[2].unsignedTxn.from = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  appCallMissing: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[0] = {
      unsignedTxn: await transactionGenerator.getPayTxn(client, maliciousAccount.addr, maliciousAccount.addr,
          1000, false),
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

  payTxnWrongType: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[1] = {
      unsignedTxn: await transactionGenerator.getPayTxn(client, maliciousAccount.addr, maliciousAccount.addr,
          1000, false),
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

  refundTxnWrongType: async function(config) {
    const outerTxns = await this.getOuterTransactions(config);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[2] = {
      unsignedTxn: await transactionGenerator.getPayTxn(client, maliciousAccount.addr, maliciousAccount.addr,
          1000, false),
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
};
module.exports = Test;
