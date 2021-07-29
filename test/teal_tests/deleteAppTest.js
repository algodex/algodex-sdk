const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
    runTest : deleteAppTest = async(config) => {
        console.log("STARTING deleteAppTest");
        const client = config.client;
        const openAccount = config.openAccount;
        const creatorAccount = config.creatorAccount;
        const executorAccount = config.executorAccount;

        console.log("starting the test");
        console.log("deleting app: " + appId);

        await testHelper.deleteApplication(client, creatorAccount, appId);

        console.log("closing account: " + creatorAccount.addr + " to " + openAccount.addr);
        await testHelper.closeAccount(client, creatorAccount, openAccount);
        await testHelper.closeAccount(client, executorAccount, openAccount);

        return true;
    }
}
module.exports = Test;
