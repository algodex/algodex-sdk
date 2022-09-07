const algosdk = require('algosdk');
const { transferFunds, transferASA } = require('../../teal/utils');
const { timeout } = require('../../../lib/teal/utils');

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
 * @param {String} optIn
 * @param {Object} newCreator
 * @return {Promise<void>}
 */
async function initCloseOrderAccounts(config, type, { amount, price }) {
  const { client, openAccount, creatorAccount, assetId } = config;

  await transferFunds(client, openAccount, creatorAccount, 2000000); //fund account for a place

  if (type === 'sell') {
    await transferASA(client, creatorAccount, creatorAccount, 0, assetId); //optIn transaction
    await transferASA(client, openAccount, creatorAccount, 2000000, assetId); // testASA
    await timeout(7000); //give enough time for indexer to pick up asset
  }

  const wallet = {
    type: 'sdk',
    address: config.creatorAccount.addr,
    connector: {
      ...config.connector,
      sk: config.creatorAccount.sk, //Just in case we want to test signing and sending from the api and not from the tests.
      connected: true,
    },
  };
  algodexApi.setWallet(wallet);

  const sellOrder = {
    asset: {
      id: config.assetId,
      decimals: 6,
    },
    address: config.creatorAccount.addr,
    price: price, // Limit price for the asset
    amount: amount, // Amount willing to purchase (The total amount sent will be price * amount)
    execution: 'maker',
    type: 'sell',
  };

  const buyOrder = {
    asset: {
      id: config.assetId,
      decimals: 6,
    },
    address: config.creatorAccount.addr,
    price: price, // Limit price for the asset
    amount: amount, // Amount willing to purchase (The total amount sent will be price * amount)
    execution: 'maker',
    type: 'buy',
  };

  await algodexApi.placeOrder(type === 'sell' ? sellOrder : buyOrder);

  await timeout(7000);
  return;

  // if (optIn) {
  //   await transferASA(client, executorAccount, executorAccount, 0, config.assetIndex); // opt in transaction
  //   await transferASA(client, openAccount, executorAccount, 2000000, config.assetIndex); // 5 algos
  // }

  // await transferFunds(client, openAccount, maliciousAccount, 5000000); // 5 algos
  // await transferASA(client, maliciousAccount, maliciousAccount, 0, config.assetIndex); // opt in transaction
  // await transferASA(client, openAccount, maliciousAccount, 2000000, config.assetIndex); // 5 algos
}

module.exports = initCloseOrderAccounts;