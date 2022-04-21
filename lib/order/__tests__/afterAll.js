const {deleteApplication, closeAccount} = require('../../teal');

/**
 *
 * @param config
 * @return {Promise<void>}
 */
async function afterAll(config) {
  const _account = typeof config.oldCreatorAccount !== 'undefined' ?
        config.oldCreatorAccount :
        config.creatorAccount;
  await deleteApplication(config.client, _account, config.appIndex);
  await closeAccount(config.client, config.creatorAccount, config.openAccount);
  await closeAccount(config.client, config.executorAccount, config.openAccount);
  await closeAccount(config.client, config.maliciousAccount, config.openAccount);
}

module.exports = afterAll;
