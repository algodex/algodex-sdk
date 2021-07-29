const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const { printTransactionDebug } = require('../../algodex_internal_api.js');

const Test = {
    runPartialExecutionTest : async function (config, asaAmountReceiving, price) {
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
            
        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    },
    runFullExecutionTest : async function (config, price) {
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
            
        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    }
}
module.exports = Test;
