const algosdk = require('algosdk');
const { transferFunds, transferASA } = require('../utils');

const AlgodexApi = require('../../AlgodexApi');

const tesnet = {
  config: {
    algod: {
      uri: 'https://node.testnet.algoexplorerapi.io',
      token: '',
    },
    indexer: {
      uri: 'https://algoindexer.testnet.algoexplorerapi.io',
      token: '',
    },
    explorer: {
      uri: 'https://indexer.testnet.algoexplorerapi.io',
      port: '',
    },
    dexd: {
      uri: 'https://api-testnet-public.algodex.com/algodex-backend',
      token: '',
    },
  },
};

const algodexApi = new AlgodexApi(tesnet);

/**
 *
 * @param {TestConfig} config
 * @param {boolean} optIn
 * @param {boolean} newCreator
 * @return {Promise<void>}
 */
async function initAccounts(config, type, optIn = false) {
  // If we are overriding the default creator account

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
    // await transferFunds(client, openAccount, creatorAccount, 5000000); //enough funds to facilitate an escrow place
    if (optIn) {
      await transferASA(client, creatorAccount, creatorAccount, 0, assetId); // opt in transaction
    }
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
