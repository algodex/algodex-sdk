const withPlaceAssetTxns = require('../txns/sell/withPlaceAssetTxns');
const withPlaceAlgoTxns = require('../txns/buy/withPlaceAlgoTxns');
const withCloseAssetTxns = require('../txns/close/withCloseAssetTxns');
const compile = require('../compile/compile');
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

const TransactionGenerator = {
  getPlaceASAEscrowOrderTxns: async function (order, optIn) {
    return await withPlaceAssetTxns(
      await compile({
        ...order,
        appId:
          typeof order.appId === 'undefined'
            ? await algodexApi.getAppId(order)
            : order.appId,
        version: 6,
        indexer: algodexApi.indexer,
        wallet: {
          ...order.wallet,
          ...(await algodexApi.http.indexer.fetchAccountInfo(order.wallet)),
        },
      })
    );
  },
  getPlaceAlgoEscrowOrderTxns: async function (order, optIn) {
    return await withPlaceAlgoTxns(
      await compile({
        ...order,
        appId:
          typeof order.appId === 'undefined'
            ? await algodexApi.getAppId(order)
            : order.appId,
        version: 6,
        indexer: algodexApi.indexer,
        wallet: {
          ...order.wallet,
          ...(await algodexApi.http.indexer.fetchAccountInfo(order.wallet)),
        },
      })
    );
  },
  getCloseASAEscrowOrderTxns: async function (order, optIn) {
    return await withCloseAssetTxns(
      await compile({
        ...order,
        appId:
          typeof order.appId === 'undefined'
            ? await algodexApi.getAppId(order)
            : order.appId,
        version: 6,
        indexer: algodexApi.indexer,
        contract: {
          creator: order.address,
        },
        wallet: {
          ...order.wallet,
          ...(await algodexApi.http.indexer.fetchAccountInfo(order.wallet)),
        },
      })
    );
  },
};

module.exports = TransactionGenerator;
