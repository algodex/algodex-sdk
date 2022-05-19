const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');
const AlgodexApi = require('../../../AlgodexApi');
const apiConfig = require('../../../../config.json');
const config = require('../../../teal/test/config');
const compile = require('../../compile');
const withLogicSigAccount = require('../../compile/withLogicSigAccount');
const makeCloseAlgoOrderTxns = require('./makeCloseAlgoOrderTxns');
const sdkSigner = require('../../../wallet/signers/AlgoSDK');
let orderbook;
/**
 * Close Algo Order Tests
 */
describe('makeCloseAlgo', ()=>{
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });
  // TODO configure test accounts with afterAll when TEST_ENV==='integration'
  // afterAll()

  it('should have a valid client', async ()=>{
    await expect(makeCloseAlgoOrderTxns({})).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a valid application index', async ()=>{
    await expect(makeCloseAlgoOrderTxns({client: config.client, appId: ()=>{}})).rejects.toBeInstanceOf(TypeError);
  });

  it(`should create CloseAlgoOrderTxns`, async ()=>{
    // Fetch orders
    if (typeof orderbook === 'undefined') {
      const res = await config.api.http.dexd.fetchOrders('wallet', config.openAccount.addr);
      // TODO add clean api endpoint
      orderbook = res.filter((o)=>o.type === 'buy')
          .map(async (o)=> {
            return await sdkSigner(await makeCloseAlgoOrderTxns(await withLogicSigAccount({
              ...o,
              client: config.client,
              address: config.openAccount.addr,
            })), config.openAccount.sk);
          });
    }
    orderbook = await Promise.all(orderbook);
    orderbook.forEach((outerTxns)=>{
      outerTxns.forEach((inner)=>{
        expect(inner.unsignedTxn).toBeInstanceOf(algosdk.Transaction);
        expect(['pay', 'appl', 'axfer'].includes(inner.unsignedTxn.type)).toEqual(true);
        if (inner.unsignedTxn.type === 'pay') {
          expect(inner.unsignedTxn.appArgs.length).toEqual(0);
        }

        if (inner.unsignedTxn.type === 'appl') {
          expect(inner.unsignedTxn.appArgs.length).toEqual(2);
          expect((new TextDecoder()).decode(inner.unsignedTxn.appArgs[0])).toEqual('close');
          // expect((new TextDecoder()).decode(inner.unsignedTxn.appArgs[1])).toEqual(_order.contract.entry);
        }
      });
    });
  });

  if (process.env.TEST_ENV === 'integration') {
    it('should send transactions', async ()=>{
      // TODO: Ensure valid testbed
      await Promise.all(orderbook.map(async (o)=>{
        await config.client.sendRawTransaction(o.map((txn)=>txn.signedTxn.blob)).do();
      }));
    });
  }
  // });
});
