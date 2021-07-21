const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : createAppTest = async(config) => {
        console.log("STARTING createAppTest");
        const client = config.client;
        const openAccount = config.openAccount;
        const creatorAccount = config.creatorAccount;

        console.log("starting the test");

        await testHelper.transferFunds(client, openAccount, creatorAccount, 5000000); //5 algos
        
        const createTxn = await transactionGenerator.getCreateAppTxn(client, creatorAccount);
        let txId = createTxn.txID().toString();
        console.log("txID: " + txId);

            // Sign the transaction

        let signedTxn = createTxn.signTxn(creatorAccount.sk);
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        try {
            await client.sendRawTransaction(signedTxn).do();
        } catch (e) {
            console.log(JSON.stringify(e));
        }

        // Wait for confirmation
        await testHelper.waitForConfirmation(client, txId);

        // display results
        let transactionResponse = await client.pendingTransactionInformation(txId).do();
        appId = transactionResponse['application-index'];
        console.log("Created new app-id: ",appId);

        let accountInfo = await testHelper.getAccountInfo(creatorAccount.addr);
        console.log( "amount: " , accountInfo.amount );

        return appId;
    }
}
module.exports = Test;
