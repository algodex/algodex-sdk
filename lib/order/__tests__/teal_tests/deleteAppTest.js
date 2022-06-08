/* eslint-disable */
const testHelper = require('../setup.js');
const transactionGenerator = require('../../lib/teal/generate_transaction_types.js');
const algosdk = require('algosdk');

const Test = {
  async runTest(config) {
    console.log('STARTING deleteAppTest');
    const client = config.client;
    const openAccount = config.openAccount;
    const creatorAccount = config.creatorAccount;
    const executorAccount = config.executorAccount;
    const maliciousAccount = config.maliciousAccount;
    const appId = config.appId;
    const fakeAppId = config.fakeAppId;

    console.log('starting the test');
    console.log('deleting app: ' + appId);

    await testHelper.deleteApplication(client, creatorAccount, appId);

    if (fakeAppId) {
      console.log('deleting fake app: ' + fakeAppId);
      await testHelper.deleteApplication(client, creatorAccount, fakeAppId);
    }

    console.log('closing account: ' + creatorAccount.addr + ' to ' + openAccount.addr);
    await testHelper.closeAccount(client, creatorAccount, openAccount);
    await testHelper.closeAccount(client, executorAccount, openAccount);
    await testHelper.closeAccount(client, maliciousAccount, openAccount);

    return true;
  },
};
module.exports = Test;
