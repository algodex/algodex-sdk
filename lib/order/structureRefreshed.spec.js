const algosdk = require('algosdk');
const structureRefreshed = require('./structures/structureRefreshed');
const AlgodexApi = require('../AlgodexApi');
const compile = require('./compile/compile');
// const Test = require('./teal/__tests__/teal_tests/createAppTest');


/**
   *
   * @type {spec.APIProperties}
   */
const apiProps = {
  'config': {
    'algod': {
      'uri': 'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com',
      'token': '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'port': 8080,
    },
    'indexer': {
      'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
      'token': '',
    },
    'dexd': {
      'uri': 'https://api-testnet-public.algodex.com/algodex-backend',
      'token': '',
    },
    'tinyman': {
      'uri': 'https://testnet.analytics.tinyman.org',
      'token': '',
    },
  },
  'wallet': {
    'type': 'sdk',
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'connector': require('../wallet/connectors/AlgoSDK'),
    'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
  },
};
const assetId = 15322902;
const api = new AlgodexApi(apiProps);

async function getOrderbook(assetId, api ) {
  const res = await api.http.dexd.fetchAssetOrders(assetId);

  return api.http.dexd.mapToAllEscrowOrders({
    buy: res.buyASAOrdersInEscrow,
    sell: res.sellASAOrdersInEscrow,
  });
}


function createOrder({price, amount, type, orderTemplate}) {
  orderTemplate = !orderTemplate ? require('../__tests__/Orders.json')[1] : orderTemplate;
  // const standardOrder = require('../__tests__/Orders.json')[1];
  return {
    ...orderTemplate,
    type: type,
    price: price,
    amount: amount,
    total: price*amount,
  };
}


const sendToTestNet = true;

it('Should have a valid wallet secret key if type is sdk and mnemonic is provided', () => {
  expect(api.wallet.connector.sk).toBeTruthy();
  expect(typeof api.wallet.connector.sign).toBe('function');
  // console.log(testOrderbook)
});

describe('test newStructure works with compile step', () => {
  // terrible practice but fine for the time being
  const groupBy = (items, key) => items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [
          ...(result[item[key]] || []),
          item.signedTxn.blob,
        ],
      }),
      {},
  );

  const sendGroupsTransactions = async (groupsOfTransactions) => {
    // terrible practice but fine for the time being.
    for (const group in groupsOfTransactions) {
      if (group !== 'prototype') {
        const {txId} = await api.algod.sendRawTransaction(groupsOfTransactions[group]).do();
        const result = await algosdk.waitForConfirmation(api.algod, txId, 10);
      }
    }
  };

  it.skip('Should handle maker buyOrders', async () => {
    const orderbook = await getOrderbook(assetId, api);
    const makerBuyOrder = createOrder({price: 3, amount: 0.1, type: 'buy'});
    makerBuyOrder.client = api.algod;
    makerBuyOrder.asset.orderbook = orderbook;
    const compiledBuyOrder = await compile(makerBuyOrder);
    const buyResult = await structureRefreshed(compiledBuyOrder);
    const signedBuyTxns = api.wallet.connector.sign(buyResult.contract.txns, api.wallet.type === 'sdk' ? api.wallet.connector.sk : undefined);
    const signedBuyGroups = groupBy(signedBuyTxns, 'groupNum');
    expect(signedBuyGroups).toBeTruthy();
    if (sendToTestNet) {
      await sendGroupsTransactions(signedBuyGroups);
      // you would expect to see a transaction of algoAmount .3 algo going to lsig.address()
    }
  }, 1000000);

  it('Should handle maker sellOrders', async () => {
    const orderbook = await getOrderbook(assetId, api);
    const makerSellOrder = createOrder({price: 260, amount: 0.001, type: 'sell'});
    makerSellOrder.client = api.algod;
    makerSellOrder.asset.orderbook = orderbook;
    const compiledSellOrder = await compile(makerSellOrder);
    const sellResult = await structureRefreshed(compiledSellOrder);
    const signedSellTxns = api.wallet.connector.sign(sellResult.contract.txns, api.wallet.type === 'sdk' ? api.wallet.connector.sk : undefined);
    const signedSellGroups = groupBy(signedSellTxns, 'groupNum');
    expect(signedSellGroups).not.toBeTruthy();
    if (sendToTestNet) {
      await sendGroupsTransactions(signedSellGroups);
      // you would expect to see a transaction of 0.001 of the currency going to lsig.address()
    }
  }, 1000000);


  it.skip('Should handle taker buyOrders', async () => {
    // const buyOrder = require('../__tests__/Orders.json')[1];

    const buyOrder = createOrder({
      price: 800,
      amount: 0.01,
      type: 'buy'});
    const orderbook = await getOrderbook(assetId, api);

    buyOrder.client = api.algod;
    buyOrder.asset.orderbook = orderbook;
    const compiledBuyOrder = await compile(buyOrder);
    const buyResult = await structureRefreshed(compiledBuyOrder);
    expect(buyResult.contract.txns).toBeTruthy();
    const signedBuyTxns = api.wallet.connector.sign(buyResult.contract.txns, api.wallet.type === 'sdk' ? api.wallet.connector.sk : undefined);
    const signedBuyGroups = groupBy(signedBuyTxns, 'groupNum');
    expect(signedBuyGroups).toBeTruthy();
    if (sendToTestNet) {
      await sendGroupsTransactions(signedBuyGroups);
    }
  }, 1000000);

  it.skip('Should handle taker sellOrders', async () => {
    const sellOrder = require('../__tests__/Orders.json')[0];
    const orderbook = await getOrderbook(assetId, api);
    sellOrder.client = api.algod;
    sellOrder.asset.orderbook = orderbook;
    const compiledSellOrder = await compile(sellOrder);
    const sellResult = await structureRefreshed(compiledSellOrder);
    expect(sellResult.contract.txns).toBeTruthy();
    const signedSellTxns = api.wallet.connector.sign(sellResult.contract.txns, api.wallet.type === 'sdk' ? api.wallet.connector.sk : undefined);
    const signedSellGroups = groupBy(signedSellTxns, 'groupNum');
    expect(signedSellGroups).toBeTruthy();
    if (sendToTestNet) {
      await sendGroupsTransactions(signedSellGroups);
    }
  }, 1000000);
});
