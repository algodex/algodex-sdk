const algosdk = require('algosdk');
const { transferFunds, transferASA } = require('../../teal/utils');

/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */
async function takerAccountCleanup(config, type, executorAmount) {
  const {
    client,
    openAccount,
    maliciousAccount,
    creatorAccount,
    executorAccount,
    assetId,
  } = config;

  if (type === 'sell') {
    const formattedExecutorAmount = executorAmount * 1000000;
    //escrowPlaceOrder
    await transferASA(
      client,
      creatorAccount,
      openAccount,
      2000000 - formattedExecutorAmount, //initial 2 units less
      assetId
    ); // transfer back ASA
    await transferFunds(client, creatorAccount, openAccount, 1500000); //transfer original algo

    await transferASA(
      client,
      executorAccount,
      openAccount,
      formattedExecutorAmount,
      assetId
    );
    await transferFunds(client, executorAccount, openAccount, 1500000); //transfer original algo
  }

  //   if (type === 'buy') {
  //     await transferFunds(client, creatorAccount, openAccount, 1750000); //transfer original algo
  //   }
}

module.exports = takerAccountCleanup;
