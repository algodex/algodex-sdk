const makePlaceAssetTxns = require('../txns/sell/makePlaceAssetTxns');
const makePlaceAlgoTxns = require('../txns/buy/makePlaceAlgoTxns');
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
    const newWallet = await algodexApi.http.indexer.fetchAccountInfo(
      order.wallet
    );
    return await makePlaceAssetTxns(
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
    return await makePlaceAlgoTxns(
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
};

module.exports = TransactionGenerator;
