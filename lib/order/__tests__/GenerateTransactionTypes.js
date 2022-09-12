const withPlaceAssetTxns = require('../txns/sell/withPlaceAssetTxns');
const withPlaceAlgoTxns = require('../txns/buy/withPlaceAlgoTxns');
const withCloseAssetTxns = require('../txns/close/withCloseAssetTxns');
const withCloseAlgoTxns = require('../txns/close/withCloseAlgoTxns');
const getTakerOrders = require('../structure/getTakerOrders');
const { timeout } = require('../../teal/utils');

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
  getPlaceASAEscrowOrderTxns: async function (order) {
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
  getPlaceAlgoEscrowOrderTxns: async function (order) {
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
  getCloseASAEscrowOrderTxns: async function (order) {
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
  getCloseAlgoEscrowOrderTxns: async function (order) {
    return await withCloseAlgoTxns(
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
  getTakerOrderTxns: async function (order) {
    algodexApi.setWallet(order.wallet);

    let _orderbook = await algodexApi.http.dexd.fetchAssetOrders(order.asset.id)

    try {
      while (
        Object.values(_orderbook).reduce((a, b) => {
          return a.concat(b); // need to put inside the while statement so the expression re runs every time _orderbook changes
        }, []).length === 0
      ) {
        await timeout(4000);
        _orderbook = await algodexApi.http.dexd.fetchAssetOrders(
          order.asset.id
        );
      }
    } catch (e) {
      throw e;
    }

    let orderbook = algodexApi.http.dexd.mapToAllEscrowOrders({
      buy: _orderbook.buyASAOrdersInEscrow,
      sell: _orderbook.sellASAOrdersInEscrow,
    });

    return await getTakerOrders(algodexApi, {
      ...order,
      appId:
        typeof order.appId === 'undefined'
          ? await algodexApi.getAppId(order)
          : order.appId,
      version: 6,
      indexer: algodexApi.indexer,
      asset: {
        ...order.asset,
        orderbook
      },
      wallet: {
        ...order.wallet,
        ...(await algodexApi.http.indexer.fetchAccountInfo(order.wallet)),
      },
    });
  },
};

module.exports = TransactionGenerator;
