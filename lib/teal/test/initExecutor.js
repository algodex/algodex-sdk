const { transferFunds, transferASA } = require('../utils');
/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */
async function initExecutor(config, type, optIn) {
  // If we are overriding the default creator account

  const { client, openAccount, executorAccount, assetId } = config;

  await transferFunds(client, openAccount, executorAccount, 2000000);
  if (type === 'sell' && optIn === true) {
    await transferASA(client, executorAccount, executorAccount, 0, assetId); // opt in transaction
  }

  if (type === 'buy') {
    //executor is willing to sell an asset
    await transferASA(client, executorAccount, executorAccount, 0, assetId); // opt in transaction

    await transferASA(client, openAccount, executorAccount, 2000000, assetId); //provide executor account with assset to sell
  }
}

module.exports = initExecutor;
