it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});

// const deleteAppTest = require('./teal_tests/deleteAppTest.js');

const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
// const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const constants = require('./constants.js');
const accountSetup = require('./accountSetup.js');
const accountCleanup = require('./accountCleanup.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');

const config = require('./TealConfig.js');

console.log(
  'DEBUG_SMART_CONTRACT_SOURCE is: ' + constants.DEBUG_SMART_CONTRACT_SOURCE
);

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
  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  beforeAll(async () => {
    await accountSetup(config, 'sell', true);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);

    await accountCleanup(config, 'sell', true);
  }, JEST_MINUTE_TIMEOUT);

  const asaAmount = 0.4;
  const price = 1.25;

  test(
    'Place asa escrow order',
    async () => {
      // const asaAmount = 0.4;
      // const price = 1.25;
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect(result).toBeTruthy();
      await timeout(4000);
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
  test(
    'Close asa escrow order',
    async () => {
      // const price = 1.25;
      const result = await closeASAOrderTest.runTest(config, price, asaAmount);
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT
  );

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
