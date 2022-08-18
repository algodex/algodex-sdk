const algosdk = require('algosdk');
const { transferFunds, transferASA } = require('../../teal/utils');

/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */
async function cleanupAccounts(
  config,
  type,
  optIn = false,
  newCreator = false
) {
  const {
    client,
    openAccount,
    maliciousAccount,
    creatorAccount,
    executorAccount,
    assetId,
  } = config;

  if (type === 'sell') {
    //escrowPlaceOrder
    await transferASA(client, creatorAccount, openAccount, 2000000, assetId); // transfer back ASA
    await transferFunds(client, creatorAccount, openAccount, 1500000); //transfer original algo
  }

  //   if (type === "buy") {
  //     await transferFunds(client, openAccount, creatorAccount, 5000000); //enough funds to facilitate an escrow place
  //     if (optIn) {
  //       await transferASA(client, creatorAccount, creatorAccount, 0, assetId); // opt in transaction
  //     }
  //   }

  // if (optIn) {
  //   await transferASA(client, executorAccount, executorAccount, 0, config.assetIndex); // opt in transaction
  //   await transferASA(client, openAccount, executorAccount, 2000000, config.assetIndex); // 5 algos
  // }

  // await transferFunds(client, openAccount, maliciousAccount, 5000000); // 5 algos
  // await transferASA(client, maliciousAccount, maliciousAccount, 0, config.assetIndex); // opt in transaction
  // await transferASA(client, openAccount, maliciousAccount, 2000000, config.assetIndex); // 5 algos
}

module.exports = cleanupAccounts;
