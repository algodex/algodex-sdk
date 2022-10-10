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

  runGroupSizeWrongTest: async function(config, skipASAOptIn = false) {
    const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    const lsig = outerTxns[1].lsig;

    outerTxns.push( {
      unsignedTxn: await makePaymentTxn(client, lsig.address(), maliciousAccount.addr,
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

  runGroupSizeWrongTest2: async function(config, skipASAOptIn = false) {
    const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

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

  runPayAmountTooLowTest: async function(config, skipASAOptIn = false) {
    const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
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

  runPayNotToLsigTest: async function(config, skipASAOptIn = false) {
    const outerTxns = await this.runTest(config, 800000, 1.375, skipASAOptIn, true);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    const lsig = outerTxns[1].lsig;

    outerTxns[0].unsignedTxn.to = algosdk.decodeAddress(maliciousAccount.addr);

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
