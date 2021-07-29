const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const { printTransactionDebug } = require('../../algodex_internal_api.js');

const Test = {
    runTest : async function (config) {
        console.log("STARTING executeAlgoEscrowOrder test");
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
    }
}
module.exports = Test;
