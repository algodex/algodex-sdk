const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const { printTransactionDebug } = require('../../algodex_internal_api.js');

const Test = {
    runTest : async function (config) {
        console.log("STARTING executeASAEscrowOrder test");
        const client = config.client;
        const executorAccount = config.executorAccount;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        const asaAmountReceiving = 80000;
        const price = 1.25;

        let algoAmountSending = asaAmountReceiving * price;

        if (Math.floor(algoAmountSending) != algoAmountSending) {
            algoAmountSending = Math.floor(algoAmountSending) + 1; // give slightly better deal to maker
        }
        
        const outerTxns = await transactionGenerator.getExecuteASAEscrowOrderTxns(client, executorAccount, creatorAccount, 
            algoAmountSending, asaAmountReceiving, price, config.assetId, appId, false);
            
        const signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    }
}
module.exports = Test;
