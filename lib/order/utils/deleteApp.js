const {closeAccount, deleteApplication} = require('../../teal');

/**
 *
 * @param {TestConfig} config
 * @return {Promise<boolean>}
 */
async function deleteApp(config) {
  const client = config.client;
  const openAccount = config.openAccount;
  const creatorAccount = config.creatorAccount;
  const executorAccount = config.executorAccount;
  const maliciousAccount = config.maliciousAccount;
  const appId = config.appId;
  const fakeAppId = config.fakeAppId;

  console.log('starting the test');
  console.log('deleting app: ' + appId);

  await deleteApplication(client, creatorAccount, appId);

  if (fakeAppId) {
    console.log('deleting fake app: ' + fakeAppId);
    await deleteApplication(client, creatorAccount, fakeAppId);
  }

  console.log('closing account: ' + creatorAccount.addr + ' to ' + openAccount.addr);
  await closeAccount(client, creatorAccount, openAccount);
  await closeAccount(client, executorAccount, openAccount);
  await closeAccount(client, maliciousAccount, openAccount);
}
module.exports = deleteApp;
