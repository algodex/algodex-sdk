/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* eslint-disable */
/* eslint-disable */
const testHelper = require('../setup.js');
const transactionGenerator = require('../GenerateTransactionTypes');
const algosdk = require('algosdk');
const signer = require('../../../wallet/signers/AlgoSDK');
const _sendTransactions = require('./sendTransactions');

const PRINT_TXNS = 0;

const Test = {
  runTest: async function(    
    config,
    takerAmount,
    price,
    returnOuterTransactions = false) {
    const client = config.client;
    console.log('STARTING executeAlgoEscrowOrder test');


    // const creatorAccount = config.executorAccount.addr;
    const wallet = {
      type: 'sdk',
      address: config.executorAccount.addr,
      connector: {
        ...config.connector,
        sk: config.executorAccount.sk, //Just in case we want to test signing and sending from the api and not from the tests.
        connected: true,
      },
      // mnemonic: config.creatorAccount.sk,
    };

    const order = {
      asset: {
        id: config.assetId,
        decimals: 6,
      },
      address: config.executorAccount.addr,
      price: price,
      amount: takerAmount,
      total: price * takerAmount,
      type: 'sell',
      client: config.client,
      execution: 'taker',
      wallet: wallet,
    };

    const executePartialAlgoEscrowOrder =
      await transactionGenerator.getTakerOrderTxns(order);

    if (returnOuterTransactions) {
      return outerTxns;
    }
    const signedTxns = await signer(
      executePartialAlgoEscrowOrder,
      config.executorAccount.sk
    );

    const confirmation = await _sendTransactions(client, signedTxns);

    return true;
  },
  getOuterExecTransations: async function(config, useFullOrderExecution) {
    if (useFullOrderExecution) {
      return await this.runFullExecTest(config, true);
    }
    return await this.runPartialExecTest(config, true);
  },
  runAssetAmtTooSmallTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // Give the escrow owner 1000 less of the asset
    outerTxns[2].unsignedTxn.amount -= 1000;
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runGroupSizeWrongTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
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

  runGroupSizeWrongTest2: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
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

  appCallMissing: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
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

  runAlgoAmtTooLargeTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // Give the taker 1000 more of the asset
    outerTxns[1].unsignedTxn.amount += 1000;
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoAmtWrongAddrTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[1].unsignedTxn.to = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoWrongAddrCloseToTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
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

  runAsaAmtWrongAddrTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[2].unsignedTxn.to = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoPayFromWrongAddrTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[1].unsignedTxn.from = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoCloseoutToWrongOwnerTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
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

  runASATransferHasCloseoutTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[2].unsignedTxn.closeRemainderTo = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runLowFeeTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[3].unsignedTxn.amount = 1000;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runFeeToWrongAddrTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

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

  runFeeFromWrongAddrTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;
    console.log('inside runFeeFromWrongAddrTest');
    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }
    const lsig = outerTxns[0].lsig;
    outerTxns[3].unsignedTxn = await transactionGenerator.getPayTxn(client, lsig.address(), lsig.address(), 2000, false);
    outerTxns[3].lsig = lsig;
    outerTxns[3].senderAcct = null;

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
