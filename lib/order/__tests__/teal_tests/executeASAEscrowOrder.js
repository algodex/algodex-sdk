/* eslint-disable */
const testHelper = require('../setup.js');
const transactionGenerator = require('../../lib/teal/generate_transaction_types.js');
const algosdk = require('algosdk');
const PRINT_TXNS = 0;

const Test = {
  runPartialExecTest: async function(config, asaAmountReceiving, price, returnOuterTransactions = false) {
    console.log('STARTING executeASAEscrowOrder partial test');
    const client = config.client;
    const executorAccount = config.executorAccount;
    const creatorAccount = config.creatorAccount;
    const appId = config.appId;

    let algoAmountSending = asaAmountReceiving * price;

    if (Math.floor(algoAmountSending) != algoAmountSending) {
      algoAmountSending = Math.floor(algoAmountSending) + 1; // give slightly better deal to maker
    }

    const outerTxns = await transactionGenerator.getExecuteASAEscrowOrderTxns(client, executorAccount, creatorAccount,
        algoAmountSending, asaAmountReceiving, price, config.assetId, appId, false);

    if (returnOuterTransactions) {
      return outerTxns;
    }

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

    await testHelper.sendAndCheckConfirmed(client, signedTxns);

    return true;
  },
  runFullExecTest: async function(config, price, returnOuterTransactions = false) {
    console.log('STARTING executeASAEscrowOrder full test');
    const client = config.client;
    const executorAccount = config.executorAccount;
    const creatorAccount = config.creatorAccount;
    const appId = config.appId;
    const assetId = config.assetId;

    const lsig = await testHelper.getOrderLsig(client, creatorAccount, price, config.assetId, true);

    const asaAmountReceiving = await testHelper.getAssetBalance(lsig.address(), assetId);

    let algoAmountSending = asaAmountReceiving * price;

    if (Math.floor(algoAmountSending) != algoAmountSending) {
      algoAmountSending = Math.floor(algoAmountSending) + 1; // give slightly better deal to maker
    }

    console.log({asaAmountReceiving}, {algoAmountSending});
    const outerTxns = await transactionGenerator.getExecuteASAEscrowOrderTxns(client, executorAccount, creatorAccount,
        algoAmountSending, asaAmountReceiving, price, assetId, appId, true);

    if (returnOuterTransactions) {
      return outerTxns;
    }
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

    await testHelper.sendAndCheckConfirmed(client, signedTxns);

    return true;
  },
  getOuterExecTransations: async function(config, useFullOrderExecution) {
    if (useFullOrderExecution) {
      return await this.runFullExecTest(config, 1.25, true);
    }
    return await this.runPartialExecTest(config, 200000, 1.25, true);
  },

  runAssetAmtTooLargeTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // Give the buyer 1000 more of the asset, thus giving a bad price for the escrow owner
    outerTxns[2].unsignedTxn.amount += 1000;
    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoAmtTooSmallTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // Give the buyer 1000 less of algos
    outerTxns[1].unsignedTxn.amount -= 1000;
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

  runASAWrongAddrCloseToTest: async function(config, useFullOrderExecution = true) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    outerTxns[2+optInOffset].unsignedTxn.closeRemainderTo = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runFeeToWrongAddrTest: async function(config, useFullOrderExecution = false) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    outerTxns[3+optInOffset].unsignedTxn.to = algosdk.decodeAddress(maliciousAccount.addr);

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runFeeTooSmallTest: async function(config, useFullOrderExecution = false) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    outerTxns[3+optInOffset].unsignedTxn.amount = 1000;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runFeeFromWrongAddrTest: async function(config, useFullOrderExecution = false) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;
    console.log('inside runFeeFromWrongAddrTest');
    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    const lsig = outerTxns[0].lsig;
    outerTxns[3+optInOffset].unsignedTxn = await transactionGenerator.getPayTxn(client, lsig.address(), lsig.address(), 2000, false);
    outerTxns[3+optInOffset].lsig = lsig;
    outerTxns[3+optInOffset].senderAcct = null;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAppCallWrongAppTest: async function(config, useFullOrderExecution = false) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;
    console.log('inside runFeeFromWrongAddrTest');
    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    outerTxns[0].unsignedTxn.appIndex = 18988134;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoBalanceCloseoutToWrongAddressTest: async function(config, useFullOrderExecution = false) {
    console.log('in runAlgoBalanceCloseoutToWrongAddressTest');
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    outerTxns[3+optInOffset].unsignedTxn.closeRemainderTo = algosdk.decodeAddress(maliciousAccount.addr);
    console.log({outerTxns});

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runAlgoPayAmountNotZeroTest: async function(config, useFullOrderExecution = false) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    outerTxns[3+optInOffset].unsignedTxn.amount = 1000;

    const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
    try {
      await testHelper.sendAndCheckConfirmed(client, signedTxns);
    } catch (e) {
      // An exception is expected. Return true for success
      return testHelper.checkFailureType(e);
    }

    return false;
  },

  runWrongTransactionTypeTest: async function(config, useFullOrderExecution = false) {
    const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
    const client = config.client;
    const maliciousAccount = config.maliciousAccount;

    if (PRINT_TXNS) {
      testHelper.printOuterTransactions(outerTxns);
    }

    // check for optInTxn
    const optInOffset = outerTxns.length == 5 ? 1 : 0;

    const lsig = outerTxns[0].lsig;
    outerTxns[3+optInOffset].unsignedTxn = await transactionGenerator.getAssetSendTxn(client, lsig.address(), maliciousAccount.addr, 2000,
        config.assetId, false);
    outerTxns[3+optInOffset].lsig = lsig;
    outerTxns[3+optInOffset].senderAcct = null;

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
