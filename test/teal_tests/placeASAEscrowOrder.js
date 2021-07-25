const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : async function (config) {
        console.log("STARTING placeASAEscrowOrder test");
        const client = config.client;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        let outerTxns = await transactionGenerator.getPlaceASAEscrowOrderTxns(client, creatorAccount, 400000, 1.25, config.assetId, appId);
        let signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);
        
        return true;
    }
}
module.exports = Test;
