it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});
const testHelper = require('./setup.js');
const connector = require('../../wallet/connectors/AlgoSDK');

// const deleteAppTest = require('./teal_tests/deleteAppTest.js');

const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
// const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const constants = require('./constants.js');
const beforeAll = require('./beforeAll.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;

const config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  maliciousAccount: testHelper.getRandomAccount(),
  client: testHelper.getLocalClient(),
  connector: connector,
  assetId: 66711302,
};

console.log(
  'DEBUG_SMART_CONTRACT_SOURCE is: ' + constants.DEBUG_SMART_CONTRACT_SOURCE
);

const textEncoder = new TextEncoder();
//
// // TODO: The negative tests need to be implemented. The commented ones out are examples but will not work with
// // this transaction type.
// const negTests = [
//   /* {txnNum: 0, field: 'from', val: algosdk.decodeAddress(config.maliciousAccount.addr) },
//    {txnNum: 0, field: 'appArgs', innerNum: 0, val: textEncoder.encode('execute') },
//    {txnNum: 0, field: 'appIndex', configKeyForVal: 'fakeAppId' },
//    {txnNum: 0, field: 'appOnComplete', val: 0},
//    {txnNum: 1, field: 'from', val: algosdk.decodeAddress(config.maliciousAccount.addr) },
//    {txnNum: 1, field: 'closeRemainderTo', val: algosdk.decodeAddress(config.maliciousAccount.addr) },
//    {txnNum: 1, negTxn: {
//             unsignedTxnPromise: transactionGenerator.getAssetSendTxn(config.client, config.maliciousAccount.addr, config.maliciousAccount.addr,
//               1000, config.assetId, false),
//             senderAcct: config.maliciousAccount
//             }
//     },
//    {txnNum: 2, field: 'from', txnKeyForVal: 'from', txnNumForVal: 1}, //set to from escrow
//    {txnNum: 2, field: 'to', val: algosdk.decodeAddress(config.maliciousAccount.addr)},
//    {txnNum: 2, negTxn: {
//             unsignedTxnPromise: transactionGenerator.getPayTxn(config.client,
//             config.maliciousAccount.addr, config.maliciousAccount.addr,
//                 1000, false),
//             senderAcct: config.maliciousAccount
//         }
//     },*/
//
// ];
//
//
describe('ASA ESCROW ORDER BOOK', () => {
  beforeAll(async () => {
    // setup step: Send target asset from open account to creator account
  });
  // test(
  //     'Create asa escrow order book',
  //     async () => {
  //       config.creatorAccount = testHelper.getRandomAccount();
  //       config.executorAccount = testHelper.getRandomAccount();
  //       config.maliciousAccount = testHelper.getRandomAccount();
  //       config.appId = await createAppTest.runTest(config, false);
  //       global.ASA_ESCROW_APP_ID = config.appId;
  //       expect(config.appId).toBeGreaterThan(0);
  //     },
  //     JEST_MINUTE_TIMEOUT,
  // );

  test(
    'Place asa escrow order',
    async () => {
      const asaAmount = 0.4;
      const price = 1.25;
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT
  );
  //
  //   negTests.map( (negTestTxnConfig) => {
  //     const testName = `Negative algo full execution order test: txnNum: ${negTestTxnConfig.txnNum} field: ${negTestTxnConfig.field} val: ${negTestTxnConfig.val}`;
  //     test(testName, async () => {
  //       if (negTestTxnConfig.negTxn) {
  //         negTestTxnConfig.negTxn.unsignedTxn = await negTestTxnConfig.negTxn.unsignedTxnPromise;
  //       }
  //       const outerTxns = await executeAlgoOrderTest.runFullExecTest(config, true);
  //       outerTxns.map( (txn) => {
  //         const unsignedTxn = txn.unsignedTxn;
  //         // console.log({unsignedTxn});
  //       });
  //       const result = await testHelper.runNegativeTest(config, config.client, outerTxns, negTestTxnConfig);
  //       expect(result).toBeTruthy();
  //     }, JEST_MINUTE_TIMEOUT);
  //   });
  //
  //
  // test(
  //   'Close asa escrow order',
  //   async () => {
  //     const price = 1.25;
  //     const result = await closeASAOrderTest.runTest(config, price);
  //     expect(result).toBeTruthy();
  //   },
  //   JEST_MINUTE_TIMEOUT
  // );

  // test(
  //   'Delete asa escrow order book',
  //   async () => {
  //     const result = await deleteAppTest.runTest(config);
  //     expect(result).toBeTruthy();
  //   },
  //   JEST_MINUTE_TIMEOUT
  // );
});
//
