const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : async function (config, algoAmount, price, skipASAOptIn = false) {
        console.log("STARTING placeAlgoEscrowOrder test");
        const client = config.client;
        const creatorAccount = config.creatorAccount;
        const appId = config.appId;

        let outerTxns = await transactionGenerator.getPlaceAlgoEscrowOrderTxns(client, creatorAccount, algoAmount, price, 
                config.assetId, appId, false, skipASAOptIn);
        let signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    },
}
module.exports = Test;
