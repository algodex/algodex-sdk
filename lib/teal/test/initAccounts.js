/* eslint-disable */

const {transferFunds, transferASA} = require('../utils');

/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */

async function initAccounts(config, type, optIn = false, note) {
  // If we are overriding the default creator account

  const {
    client,
    openAccount,
    creatorAccount,
    assetId,
  } = config;

  await transferFunds(client, openAccount, creatorAccount, 2000000, note);

  if (type === 'sell') {
    // escrowPlaceOrder
    await transferASA(client, creatorAccount, creatorAccount, 0, assetId, note); // opt in transaction
    await transferASA(client, openAccount, creatorAccount, 2000000, assetId, note); // testASA
  }

  if (type === 'buy') {
    // await transferFunds(client, openAccount, creatorAccount, 5000000); //enough funds to facilitate an escrow place
    if (optIn) {
      await transferASA(client, creatorAccount, creatorAccount, 0, assetId, note); // opt in transaction
    }
  }
}

module.exports = initAccounts;
