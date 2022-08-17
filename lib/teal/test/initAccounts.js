const algosdk = require('algosdk');
const { transferFunds, transferASA } = require('../utils');

/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */
async function initAccounts(config, type, optIn = false, newCreator = false) {
  // If we are overriding the default creator account
  if (newCreator) {
    // This creates the config.oldCreatorAccount key
    // and overrides the current creator account
    config.setCreatorAccount(algosdk.generateAccount());
  }
  const {
    client,
    openAccount,
    maliciousAccount,
    creatorAccount,
    executorAccount,
    assetId,
  } = config;

  await transferFunds(client, openAccount, creatorAccount, 2000000);

  if (type === 'sell') {
    //escrowPlaceOrder
    await transferASA(client, creatorAccount, creatorAccount, 0, assetId); // opt in transaction
    await transferASA(client, openAccount, creatorAccount, 2000000, assetId); // testASA
  }

  if (type === 'buy') {
    await transferFunds(client, openAccount, creatorAccount, 5000000); //enough funds to facilitate a escrow order
  }

  // if (optIn) {
  //   await transferASA(client, executorAccount, executorAccount, 0, config.assetIndex); // opt in transaction
  //   await transferASA(client, openAccount, executorAccount, 2000000, config.assetIndex); // 5 algos
  // }

  // await transferFunds(client, openAccount, maliciousAccount, 5000000); // 5 algos
  // await transferASA(client, maliciousAccount, maliciousAccount, 0, config.assetIndex); // opt in transaction
  // await transferASA(client, openAccount, maliciousAccount, 2000000, config.assetIndex); // 5 algos
}

module.exports = initAccounts;
