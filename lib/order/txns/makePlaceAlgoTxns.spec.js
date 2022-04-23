const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const compile = require('../compile');
const makePlaceAlgoTxns = require('./makePlaceAlgoTxns');
const sdkSigner = require('../../wallet/signers/AlgoSDK');
const orders = require('../../__tests__/Orders.json');

/**
 * This test suite is for "Buy" side Orders in "Maker" Mode
 */
describe('makePlaceAlgoTxns', ()=>{
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
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

  orders.filter((o)=>o.type === 'buy').map((o, idx)=>{
    return {
      order: o,
      exist: idx % 3 === 0,
      optIn: idx % 2 === 0,
    };
  }).forEach(({order, exist, optIn})=>{
    let signedTxns;
    it('should create PlaceAlgoTxns', async ()=>{
      order.client = config.client;
      order.address = config.openAccount.addr;
      order.wallet = config.openAccount;

      const _order = await compile(order);
      _order.contract.from = _order.address;
      _order.contract.to = _order.contract.escrow;

      const outerTxns = await makePlaceAlgoTxns(_order, exist, optIn, undefined, undefined);
      outerTxns.forEach((inner)=>{
        expect(inner.unsignedTxn).toBeInstanceOf(algosdk.Transaction);
        expect(['pay', 'appl', 'axfer'].includes(inner.unsignedTxn.type)).toEqual(true);
        if (inner.unsignedTxn.type === 'pay') {
          expect(inner.unsignedTxn.appArgs.length).toEqual(0);
        }

        if (inner.unsignedTxn.type === 'appl') {
          expect(inner.unsignedTxn.appArgs.length).toEqual(3);
        }
        if (inner.unsignedTxn.type === 'axfer') {
          expect(inner.unsignedTxn.appArgs.length).toEqual(0);
        }
      });

      signedTxns = await sdkSigner(outerTxns, config.openAccount.sk);
      signedTxns.forEach((inner)=>{
        expect(typeof inner.signedTxn.txID).toEqual('string');
      });
    });

    if (process.env.TEST_ENV === 'integration') {
      it('should send transactions', async ()=>{
        // TODO: Ensure valid testbed
        await order.client.sendRawTransaction(signedTxns.map((txn)=>txn.signedTxn.blob)).do();
        await Promise.all(
            signedTxns.map((inner)=>{
              return algosdk.waitForConfirmation(order.client, inner.signedTxn.txID, 10 );
            }),
        );
      });
    }
  });
});
