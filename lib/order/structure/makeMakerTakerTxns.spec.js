const algosdk = require('algosdk');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const makeMakerTakerTxns = require('./makeMakerTakerTxns');
const sdkSigner = require('../../wallet/signers/AlgoSDK');

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

describe('makeAlgoMakerTakerTxns', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });


  let signedTxns;
  it('should create PlaceAssetTxns', async ()=>{
    const order = {
      'asset': {
        'id': 15322902,
        'decimals': 6,
      },
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'price': 2,
      'amount': 1,
      'total': 2,
      'execution': 'taker',
      'type': 'sell',
      'appId': 22045503,
      'version': 6,
    };
    // Fetch orders
    const res = await config.api.http.dexd.fetchAssetOrders(order.asset.id);
    const orderbook = config.api.http.dexd.mapToAllEscrowOrders({
      buy: res.buyASAOrdersInEscrow,
      sell: res.sellASAOrdersInEscrow,
    });
    order.client = config.client;
    order.asset.orderbook = orderbook;

    const outerTxns = await makeMakerTakerTxns(order);
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
        // expect(dec.decode(inner.unsignedTxn.appArgs[1])).toEqual(order.contract.entry.slice(59));
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
