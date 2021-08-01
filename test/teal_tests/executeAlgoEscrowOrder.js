const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const { printTransactionDebug } = require('../../algodex_internal_api.js');

const PRINT_TXNS = 1;

const Test = {
    runPartialExecTest : async function (config, returnOuterTransactions = false) {
        console.log("STARTING executeAlgoEscrowOrder runPartialExecTest test");
        const client = config.client;
        const executorAccount = config.executorAccount;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        const algoAmountReceiving = 130000;
        const price = 1.2;

        let asaAmountSending = algoAmountReceiving / price;
        if (Math.floor(asaAmountSending) != asaAmountSending) {
            asaAmountSending = Math.floor(asaAmountSending) + 1; // give slightly better deal to maker
        }

        const outerTxns = await transactionGenerator.getExecuteAlgoEscrowOrderTxns(client, executorAccount, creatorAccount, 
            algoAmountReceiving, asaAmountSending, price, config.assetId, appId, false);

        if (returnOuterTransactions) {
            return outerTxns;
        }

        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    },

    runFullExecTest : async function (config, returnOuterTransactions = false) {
        console.log("STARTING executeAlgoEscrowOrder runFullExecTest test");
        const client = config.client;
        const executorAccount = config.executorAccount;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        const price = 1.2;

        const lsig = await testHelper.getOrderLsig(client, creatorAccount, price, config.assetId, false);
        let accountInfo = await testHelper.getAccountInfo(lsig.address());
        console.log( "current escrow amount: " , accountInfo.amount );
        const algoAmountReceiving = accountInfo.amount - 200000; // amount to trade. rest will be closed out

        let asaAmountSending = algoAmountReceiving / price;
        if (Math.floor(asaAmountSending) != asaAmountSending) {
            asaAmountSending = Math.floor(asaAmountSending) + 1; // give slightly better deal to maker
        }

        const outerTxns = await transactionGenerator.getExecuteAlgoEscrowOrderTxns(client, executorAccount, creatorAccount, 
            algoAmountReceiving, asaAmountSending, price, config.assetId, appId, true);

        if (returnOuterTransactions) {
            return outerTxns;
        }

        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    },
    getOuterExecTransations: async function (config, useFullOrderExecution) {
        if (useFullOrderExecution) {
            return await this.runFullExecTest(config, true);
        }
        return await this.runPartialExecTest(config, true);
    },
    runAssetAmtTooSmallTest : async function (config, useFullOrderExecution = true) {
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

    runGroupSizeWrongTest : async function (config, useFullOrderExecution = true) {
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
            lsig: lsig
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

    runGroupSizeWrongTest2 : async function (config, useFullOrderExecution = true) {
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
            senderAcct: maliciousAccount
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

    appCallMissing : async function (config, useFullOrderExecution = true) {
        const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
        const client = config.client;
        const maliciousAccount = config.maliciousAccount;

        if (PRINT_TXNS) {
            testHelper.printOuterTransactions(outerTxns);
        }

        outerTxns[0] = {
            unsignedTxn: await transactionGenerator.getPayTxn(client, maliciousAccount.addr, maliciousAccount.addr,
                1000, false),
            senderAcct: maliciousAccount
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

    runAlgoAmtTooLargeTest : async function (config, useFullOrderExecution = true) {
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

    runAlgoAmtWrongAddrTest : async function (config, useFullOrderExecution = true) {
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

    runAlgoWrongAddrCloseToTest : async function (config, useFullOrderExecution = true) {
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

    runAsaAmtWrongAddrTest : async function (config, useFullOrderExecution = true) {
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

    runAlgoPayFromWrongAddrTest : async function (config, useFullOrderExecution = true) {
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

    runAlgoCloseoutToWrongOwnerTest : async function (config, useFullOrderExecution = true) {
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

    runASATransferHasCloseoutTest : async function (config, useFullOrderExecution = true) {
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

    runLowFeeTest : async function (config, useFullOrderExecution = true) {
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

    runFeeToWrongAddrTest : async function (config, useFullOrderExecution = true) {
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
    
    runFeeFromWrongAddrTest : async function (config, useFullOrderExecution = true) {
        const outerTxns = await this.getOuterExecTransations(config, useFullOrderExecution);
        const client = config.client;
        const maliciousAccount = config.maliciousAccount;
        console.log("inside runFeeFromWrongAddrTest");
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
}
module.exports = Test;
