const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const compile = require('../compile');
const makePlaceAlgoTxns = require('./makePlaceAlgoTxns');
const sdkSigner = require('../../wallet/signers/AlgoSDK');
const orders = require('../../__tests__/Orders.json');

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

const sendGroupsTransactions = async (client, groupsOfTransactions) => {
  // terrible practice but fine for the time being.
  for (const group in groupsOfTransactions) {
    if (group !== 'prototype') {
      const {txId} = await client.sendRawTransaction(groupsOfTransactions[group]).do();
      await algosdk.waitForConfirmation(client, txId, 10);
    }
  }
};

/**
 * This test suite is for "Buy" side Orders in "Maker" Mode
 */
describe('makePlaceAlgoTxns', ()=>{
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });
  // TODO configure test accounts with afterAll when TEST_ENV==='integration'
  // afterAll()

  it('should have a valid client', async ()=>{
    await expect(makePlaceAlgoTxns({})).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a valid application index', async ()=>{
    await expect(makePlaceAlgoTxns({client: config.client, appId: ()=>{}})).rejects.toBeInstanceOf(TypeError);
  });

  it('should have a valid contract entry', async ()=>{
    await expect(makePlaceAlgoTxns({client: config.client, appId: 123456, contract: {entry: 1234}})).rejects.toBeInstanceOf(TypeError);
  });

  // orders.filter((o)=>o.type === 'buy').map((o, idx)=>{
  //   return {
  //     order: o,
  //     exist: idx % 3 === 0,
  //     optIn: idx % 2 === 0,
  //   };
  // }).forEach(({order, exist, optIn})=>{
  let signedTxns;
  it('should create PlaceAlgoTxns', async ()=>{
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

    const outerTxns = await makePlaceAlgoTxns(_order, true, false);
    outerTxns.forEach((inner)=>{
      expect(inner.unsignedTxn).toBeInstanceOf(algosdk.Transaction);
      expect(['pay', 'appl', 'axfer'].includes(inner.unsignedTxn.type)).toEqual(true);
      if (inner.unsignedTxn.type === 'pay') {
        expect(inner.unsignedTxn.appArgs.length).toEqual(0);
      }

      if (inner.unsignedTxn.type === 'appl') {
        const dec = new TextDecoder();
        expect(inner.unsignedTxn.appArgs.length).toEqual(3);
        // Ensure app argument is equal to the orderbook entry, minus account address
        expect(dec.decode(inner.unsignedTxn.appArgs[1])).toEqual(_order.contract.entry.slice(59));
      }
      if (inner.unsignedTxn.type === 'axfer') {
        expect(inner.unsignedTxn.appArgs.length).toEqual(0);
      }
    });

    signedTxns = await sdkSigner(outerTxns, config.api.wallet.connector.sk );
    signedTxns.forEach((inner)=>{
      expect(typeof inner.signedTxn.txID).toEqual('string');
    });
  });

  if (process.env.TEST_ENV === 'integration') {
    it('should send transactions', async ()=>{
      const signedBuyGroups = groupBy(signedTxns, 'groupNum');
      expect(signedBuyGroups).toBeTruthy();

      await sendGroupsTransactions(config.client, signedBuyGroups);
    }, 50000);
  }
  // });
});
