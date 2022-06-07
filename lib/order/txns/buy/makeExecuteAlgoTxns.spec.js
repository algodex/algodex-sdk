const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');
const AlgodexApi = require('../../../AlgodexApi');
const apiConfig = require('../../../../config.json');
const config = require('../../../teal/test/config');
const compile = require('../../compile');
const withLogicSigAccount = require('../../compile/withLogicSigAccount');
const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');
const sdkSigner = require('../../../wallet/signers/AlgoSDK');
// const orders = require('../../../__tests__/Orders.json');

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

// getOrderLsig : async function (algodClient, makerAccount,
//   price, assetId, isASAEscrow) {
//
//   const orderCreatorAddr = makerAccount.addr;
//   const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
//   const n = numAndDenom.n;
//   const d = numAndDenom.d;
//
//   const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, isASAEscrow, constants.ESCROW_CONTRACT_VERSION);
//   const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
//   return lsig;
// },
// ToDo: Change the loading of orders to accomadate taker
// fetch orderbook => filter against order => compile escrowLsig=> structure takerTransactions
/**
 * This test suite is for "Sell" side Orders in "Taker" Mode
 */
describe('makeExecuteAlgoTxns', () => {
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async () => {
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });
  // TODO configure test accounts with afterAll when TEST_ENV==='integration'
  // afterAll()

  it('should have a valid client', async () => {
    await expect(makeExecuteAlgoTxns({})).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a valid application index', async () => {
    await expect(makeExecuteAlgoTxns({client: config.client, appId: () => { }})).rejects.toBeInstanceOf(TypeError);
  });

  it('should have a valid contract entry', async () => {
    await expect(makeExecuteAlgoTxns({client: config.client, appId: 123456, contract: {entry: 1234}})).rejects.toBeInstanceOf(TypeError);
  });

  // orders.filter((o)=>o.type === 'buy').map((o, idx)=>{
  //   return {
  //     order: o,
  //     exist: idx % 3 === 0,
  //     optIn: idx % 2 === 0,
  //   };
  // }).forEach(({order, exist, optIn})=>{
  let signedTxns;
  it('should create ExecuteAlgoTxns', async () => {
    const openBuyOrder = (await config.api.http.dexd.fetchOrders('wallet', 'UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A')).filter((o) => o.type === 'buy')[0];
    openBuyOrder.wallet = config.api.wallet;
    openBuyOrder.client = config.client;
    const _order = await compile(openBuyOrder);
    if (_order.contract.lsig.address() !== _order.contract.escrow) {
      throw new Error('Not supposed to happen!');
    }
    const outerTxns = await makeExecuteAlgoTxns(_order, true);
    // TXN 0 - ESCROW TO ORDERBOOK: makeApplicationCloseOutTxn - transaction must be a call to a stateful contract
    // TXN 1 - ESCROW TO SELLER: makePaymentTxn - Payment transaction from this escrow to seller, with closeout to owner (buyer)
    // TXN 2 - SELLER TO BUYER: makeAssetTransferTxn - Asset transfer from seller to owner of this escrow (buyer)
    outerTxns.forEach((inner) => {
      expect(inner.unsignedTxn).toBeInstanceOf(algosdk.Transaction);
      expect(['pay', 'appl', 'axfer'].includes(inner.unsignedTxn.type)).toEqual(true);
      if (inner.unsignedTxn.type === 'pay') {
        expect(inner.unsignedTxn.appArgs.length).toEqual(0);
      }

      if (inner.unsignedTxn.type === 'appl') {
        const dec = new TextDecoder();
        expect(inner.unsignedTxn.appArgs.length).toEqual(2);
        // Ensure app argument is equal to the orderbook entry, minus account address
        expect(dec.decode(inner.unsignedTxn.appArgs[1])).toEqual(_order.contract.entry);
      }
      if (inner.unsignedTxn.type === 'axfer') {
        expect(inner.unsignedTxn.appArgs.length).toEqual(0);
      }
    });

    signedTxns = await sdkSigner([{contract: {
      txns: outerTxns,
    }}], config.api.wallet.connector.sk);
    signedTxns[0].forEach((inner) => {
      expect(typeof inner.txID).toEqual('string');
    });
  });

  if (process.env.TEST_ENV === 'integration') {
    it('should send transactions', async () => {
      const signedBuyGroups = groupBy(signedTxns[0], 'groupNum');
      expect(signedBuyGroups).toBeTruthy();

      await sendGroupsTransactions(config.client, signedBuyGroups);
    }, 50000);
  }
  // });
});
