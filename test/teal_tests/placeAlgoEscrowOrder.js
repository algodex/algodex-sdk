const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : async function (config) {
        console.log("STARTING placeAlgoEscrowOrder test");
        const client = config.client;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        let outerTxns = await transactionGenerator.getPlaceAlgoEscrowOrderTxns(client, creatorAccount, 800000, 1.2, 15322902, appId);
        let signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);
    }
}
module.exports = Test;
