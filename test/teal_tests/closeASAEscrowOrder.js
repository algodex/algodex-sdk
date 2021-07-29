const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : async function (config, price) {
        console.log("STARTING close asa escrow order test");
        const client = config.client;
        const creatorAccount = config.creatorAccount;
        const assetId = config.assetId;
        const appId = config.appId;
        console.log("creator account is: " + creatorAccount.addr);
        
        let outerTxns = await transactionGenerator.getCloseASAEscrowOrderTxns(client, creatorAccount, price, assetId, appId);
        let signedTxns = testHelper.groupAndSignTransactions(outerTxns);

        await testHelper.sendAndCheckConfirmed(client, signedTxns);

        return true;
    }
}
module.exports = Test;
