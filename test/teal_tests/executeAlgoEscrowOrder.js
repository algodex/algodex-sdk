const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const { printTransactionDebug } = require('../../algodex_internal_api.js');

const Test = {
    runPartialExecTest : async function (config) {
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

    runIncorrectPriceTest : async function (config) {
        const outerTxns = await this.runFullExecTest(config, true);
        const client = config.client;

        //for (let i = 0; i < outerTxns.length; i++ ) {
        //    console.log(outerTxns[i]);
        //}

        // Give the escrow owner 1000 less of the asset
        outerTxns[2].unsignedTxn.amount -= 1000;
        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);
        try {
            await testHelper.sendAndCheckConfirmed(client, signedTxns);
        } catch (e) {
            // An exception is expected. Return true for success
            return true;
        }

        return false;
    }
}
module.exports = Test;
