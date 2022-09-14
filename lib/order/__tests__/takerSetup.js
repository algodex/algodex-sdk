/* eslint-disable */
const {timeout} = require('../../../lib/teal/utils');

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
async function takerSetup(config, type, {amount, price}) {
  const wallet = {
    type: 'sdk',
    address: config.openAccount.addr,
    connector: {
      ...config.connector,
      sk: config.openAccount.sk, // Just in case we want to test signing and sending from the api and not from the tests.
      connected: true,
    },
  };
  algodexApi.setWallet(wallet);

  const sellOrder = {
    asset: {
      id: config.assetId,
      decimals: 6,
    },
    address: config.openAccount.addr,
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
    address: config.openAccount.addr,
    price: price, // Limit price for the asset
    amount: amount, // Amount willing to purchase (The total amount sent will be price * amount)
    execution: 'maker',
    type: 'buy',
  };

  await algodexApi.placeOrder(type === 'sell' ? sellOrder : buyOrder);

  await timeout(7000);
  return;
}

module.exports = takerSetup;
