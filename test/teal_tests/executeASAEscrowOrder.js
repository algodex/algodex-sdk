const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const PRINT_TXNS = 1;

const Test = {
    runPartialExecTest : async function (config, asaAmountReceiving, price, returnOuterTransactions = false) {
        console.log("STARTING executeASAEscrowOrder partial test");
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
    runFullExecTest : async function (config, price, returnOuterTransactions = false) {
        console.log("STARTING executeASAEscrowOrder full test");
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
    getOuterExecTransations: async function (config, useFullOrderExecution) {
        if (useFullOrderExecution) {
            return await this.runFullExecTest(config, 1.25, true);
        }
        return await this.runPartialExecTest(config, 200000, 1.25, true);
    },

    runAssetAmtTooLargeTest : async function (config, useFullOrderExecution = true) {
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

    runAlgoAmtTooSmallTest : async function (config, useFullOrderExecution = true) {
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

}
module.exports = Test;
