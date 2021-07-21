const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : deleteAppTest = async(config) => {
        console.log("STARTING deleteAppTest");
        const client = config.client;
        const openAccount = config.openAccount;
        const creatorAccount = config.creatorAccount;

        console.log("starting the test");

        console.log("deleting app: " + appId);

        await testHelper.deleteApplication(client, creatorAccount, appId);

        console.log("closing account: " + openAccount.addr + " to " + creatorAccount.addr);
        await testHelper.closeAccount(client, creatorAccount, openAccount);
    }
}
module.exports = Test;
