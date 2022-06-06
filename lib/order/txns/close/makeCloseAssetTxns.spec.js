const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');
const AlgodexApi = require('../../../AlgodexApi');
const apiConfig = require('../../../../config.json');
const config = require('../../../teal/test/config');
const makeCloseAssetTxns = require('./makeCloseAssetTxns');
const sdkSigner = require('../../../wallet/signers/AlgoSDK');
const withLogicSigAccount = require('../../compile/withLogicSigAccount');
let signedTxns = [];
/**
 * Close Algo Order Tests
 */
describe('makeCloseAsset', ()=>{
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });
  // TODO configure test accounts with afterAll when TEST_ENV==='integration'
  // afterAll()

  it('should have a valid client', async ()=>{
    await expect(makeCloseAssetTxns({})).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a valid application index', async ()=>{
    await expect(makeCloseAssetTxns({client: config.client, appId: ()=>{}})).rejects.toBeInstanceOf(TypeError);
  });

  it(`should create CloseAssetTxns`, async ()=>{
    // There is a bad sell order for the test wallet
    // https://testnet.algoexplorer.io/address/CVV4EEV3USYZA3U6PHHQ3DRNXZHZIY5X3V6BHJXS7IFWUPPRKAVOHCOSZQ
    function isBadOrder(o) {
      return o.type === 'sell' && o.appId === 22045522 && o.asset.id === 24891477 && o.price === 360;
    }
    // Fetch the Orderbook
    const orderbook = (await config.api.http.dexd.fetchOrders('wallet', config.openAccount.addr))
        .filter((o)=>o.type === 'sell' && !isBadOrder(o));

    // Make sure the order exists! If the test has failed, ensure that at least one order has been created
    expect(orderbook.length).toBeGreaterThan(0);

    // Create All Close Txns for All Existing Orders in the Orderbook
    const allTxns = await Promise.all(
        orderbook.map(async (o)=> {
          return await makeCloseAssetTxns(await withLogicSigAccount({
            ...o,
            client: config.client,
            // Order address is mapped to escrow from the api to execute, massage to address
            address: config.openAccount.addr,
          }));
        }),
    );

    // Sign the transactions
    signedTxns = await Promise.all(allTxns.map(async (o)=> await sdkSigner(o, config.openAccount.sk)));

    // Expect specific types of transactions
    allTxns.forEach((outerTxns)=>{
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
      // Make sure the order exists! If the test has failed, ensure that at least one order has been created
      expect(signedTxns.length).toBeGreaterThan(0);
      await Promise.all(signedTxns.map(async (o)=>{
        await config.client.sendRawTransaction(o.map((txn)=>txn.signedTxn.blob)).do();
      }));
    });
  }
});
