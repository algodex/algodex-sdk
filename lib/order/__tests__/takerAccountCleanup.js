/* eslint-disable */
const {transferFunds, transferASA} = require('../../teal/utils');

/**
 *
 * @param {TestConfig} config
 * @param {boolean} type
 * @param {number} executorAmount
 * @param {boolean} closeOut
 * @return {Promise<void>}
 */
async function takerAccountCleanup(config, type, executorAmount, closeOut) {
  const {
    client,
    openAccount,
    creatorAccount,
    executorAccount,
    assetId,
  } = config;

  if (type === 'sell') {
    const formattedExecutorAmount = executorAmount * 1000000;
    // escrowPlaceOrder
    await transferASA(
        client,
        creatorAccount,
        openAccount,
        2000000 - formattedExecutorAmount, // initial 2 units less
        assetId,
    ); // transfer back ASA
    await transferFunds(client, creatorAccount, openAccount, 1250000); // transfer original algo

    await transferASA(
        client,
        executorAccount,
        openAccount,
        formattedExecutorAmount-10000, // account for potential rounding errors
        assetId,
    );
    await transferFunds(client, executorAccount, openAccount, 1250000); // transfer original algo
  }

  if (type === 'buy') {
    const formattedExecutorAmount = executorAmount * 1000000;
    await transferASA(
        client,
        executorAccount,
        openAccount,
        2000000 - formattedExecutorAmount,
        assetId,
    );
    await transferFunds(client, executorAccount, openAccount, 2000000); // transfer original algo
    if (closeOut) {
      await transferFunds(client, creatorAccount, openAccount, 1200000);

      await transferASA(
          client,
          creatorAccount,
          openAccount,
          formattedExecutorAmount- 10000,
          assetId,
      );
    } else {
      await transferFunds(client, creatorAccount, openAccount, 1500000);
      await transferASA(
          client,
          creatorAccount,
          openAccount,
          formattedExecutorAmount,
          assetId,
      );
    }
  }

  //   if (type === 'buy') {
  //     await transferFunds(client, creatorAccount, openAccount, 1750000); //transfer original algo
  //   }
}

module.exports = takerAccountCleanup;
