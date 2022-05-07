const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const compile = require('../compile');
const sdkSigner = require('../../wallet/signers/AlgoSDK');
const withLogicSigAccount = require('../compile/withLogicSigAccount');
const structure = require('./structure');
const {_mapOrderToTemplate} = require('../compile/compileDelegateTemplate');

const
  groupBy = (items, key) => items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [
          ...(result[item[key]] || []),
          item.signedTxn.blob,
        ],
      }),
      {},
  );

const
  sendGroupsTransactions = async (client, groupsOfTransactions) => {
    // terrible practice but fine for the time being.
    for (const group in groupsOfTransactions) {
      if (group !== 'prototype') {
        const {txId} = await client.sendRawTransaction(groupsOfTransactions[group]).do();
        await algosdk.waitForConfirmation(client, txId, 10);
      }
    }
  };

async function getOrderbook(assetId, api) {
  const res = await api.http.dexd.fetchAssetOrders(assetId);

  return api.http.dexd.mapToAllEscrowOrders({
    buy: res.buyASAOrdersInEscrow,
    sell: res.sellASAOrdersInEscrow,
  });
}
// ToDo: Change the loading of orders to accomadate taker
// fetch orderbook => filter against order => compile escrowLsig=> structure takerTransactions
/**
 * This test suite is for "Sell" side Orders in "Taker" Mode
 */
describe('structure', () => {
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async () => {
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });

  it('should have a valid client', async () => {
    await expect(structure({})).rejects.toBeInstanceOf(AlgodError);
  });

  let signedTxns;
  it('should structure a single transaction when placeAlgo escrow already exists', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 2,
      'amount': 1,
      'total': 2,
      'execution': 'maker',
      'type': 'buy',
      'appId': 22045503,
      'version': 6,
    };
    order.client = config.client;
    const _order = await compile(order);
    _order.contract.from = _order.address;
    _order.contract.to = _order.contract.escrow;
    _order.isExistingEscrow = true;
    _order.contract.creator = order.address;

    const structuredOrder = await structure(_order);
    const outerTxns = structuredOrder.contract.txns;
    expect(outerTxns.length).toEqual(1); // In this scenario we only expect a single transaction of type:'pay'
    expect(outerTxns[0].unsignedTxn.type).toBe('pay');
    expect(outerTxns[0].unsignedTxn.appArgs.length).toEqual(0);

    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });

    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }, 500000);

  it('should structure a single transaction when placeAsset and escrow already exists', async () => {
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 430,
      'amount': 0.001,
      'total': 0.430,
      'execution': 'maker',
      'type': 'sell',
      'appId': 22045522,
      'version': 6,
    };
    order.client = config.client;
    const _order = await compile(order);
    _order.contract.from = _order.address;
    _order.contract.to = _order.contract.escrow;
    // _order.isExistingEscrow = true
    _order.contract.creator = order.address;
    // _order.skipASA

    const structuredOrder = await structure(_order);
    const outerTxns = structuredOrder.contract.txns;
    // expect(outerTxns.length).toEqual(1) //In this scenario we only expect a single transaction of type:'pay'
    // expect(outerTxns[0].unsignedTxn.type).toBe('axfer')
    // expect(outerTxns[0].unsignedTxn.appArgs.length).toEqual(0)

    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk);
    signedTxns.forEach((inner) => {
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });

    if (process.env.TEST_ENV === 'integration') {
      if (typeof signedTxns.groupNum !== 'undefined') {
        const signedBuyGroups = groupBy(signedTxns, 'groupNum');
        expect(signedBuyGroups).toBeTruthy();
        await sendGroupsTransactions(config.client, signedBuyGroups);
      } else {
        const signedBuyTxns = signedTxns.map((txn) => txn.signedTxn.blob);
        const {txId} = await config.client.sendRawTransaction(signedBuyTxns).do();
        await algosdk.waitForConfirmation(config.client, txId, 10);
        // await sendGroupsTransactions(config.client, signedBuyGroups);
      }
    }
  }, 500000);

  it('should cancel an existing sellOrder', async () => {
    const userOpenOrders = await config.api.http.dexd.fetchOrders('wallet', config.openAccount.addr);

    const orderbook = await getOrderbook(15322902, config.api);
    const userEscrowSell = orderbook.filter((order) => {
      return order.orderCreatorAddr === config.openAccount.addr &&
                order.escrowOrderType === 'sell';
    });

    const lsig = await withLogicSigAccount({
      ...userOpenOrders[0],
      client: config.client,
      address: config.openAccount.addr,
    });


    expect(userEscrowSell).not.toBeTruthy();
  });
});


// NOTE: I cannot get the below pattern to work properly. When testing the suite, this block runs before the it statement above it which breaks

// if (process.env.TEST_ENV === 'integration') {
//     it('should send transactions', async () => {
//         if (typeof signedTxns.groupNum !== 'undefined') {
//             const signedBuyGroups = groupBy(signedTxns, 'groupNum');
//             expect(signedBuyGroups).toBeTruthy();
//             await sendGroupsTransactions(config.client, signedBuyGroups);
//         } else {
//             const signedBuyTxns = signedTxns.map(txn => txn.signedTxn.blob)
//             const { txId } = await config.client.sendRawTransaction(signedBuyTxns).do();
//             await algosdk.waitForConfirmation(config.client, txId, 10);
//             // await sendGroupsTransactions(config.client, signedBuyGroups);
//         }

//         // await sendGroupsTransactions(config.client, signedBuyGroups);
//     }, 50000);
// }


// outerTxns.forEach((inner) => {
//     expect(inner.unsignedTxn).toBeInstanceOf(algosdk.Transaction);
//     expect(['pay', 'appl', 'axfer'].includes(inner.unsignedTxn.type)).toEqual(true);
//     if (inner.unsignedTxn.type === 'pay') {
//         expect(inner.unsignedTxn.appArgs.length).toEqual(0);
//     }

//     if (inner.unsignedTxn.type === 'appl') {
//         const dec = new TextDecoder();
//         expect(inner.unsignedTxn.appArgs.length).toEqual(3);
//         // Ensure app argument is equal to the orderbook entry, minus account address
//         expect(dec.decode(inner.unsignedTxn.appArgs[1])).toEqual(_order.contract.entry.slice(59));
//     }
//     if (inner.unsignedTxn.type === 'axfer') {
//         expect(inner.unsignedTxn.appArgs.length).toEqual(0);
//     }
// });


