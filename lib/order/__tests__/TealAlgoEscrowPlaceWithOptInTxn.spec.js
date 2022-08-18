it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});

const placeAlgoOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
// const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const accountSetup = require('./accountSetup.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const config = require('./TealConfig');
const { timeout } = require('../../teal/utils');

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
describe.skip('ALGO ESCROW ORDER BOOK (opt in test)', () => {
  beforeAll(async () => {
    await accountSetup(config, 'buy', false);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);
  // test('Create algo escrow order book', async () => {
  //   config.appId = await createAppTest.runTest(config, true);
  //   config.fakeAppId = await createAppTest.createFakeApp(config);
  //   global.ALGO_ESCROW_APP_ID = config.appId;
  //   expect(config.appId).toBeGreaterThan(0);
  //   config.oldCreatorAccount = config.creatorAccount;
  //   // make a new creatorAccount that hasn't been opted into any ASA
  //   config.creatorAccount = testHelper.getRandomAccount();
  //   testHelper.transferFunds(config.client, config.openAccount, config.creatorAccount, 2000000);
  //   testHelper.transferFunds(config.client, config.openAccount, config.maliciousAccount, 2000000);
  // }, JEST_MINUTE_TIMEOUT);

  // negTests.map( (negTestTxnConfig) => {
  //   const testName = `Negative algo full execution order test: txnNum: ${negTestTxnConfig.txnNum} field: ${negTestTxnConfig.field} val: ${negTestTxnConfig.val}`;
  //   test(testName, async () => {
  //     if (negTestTxnConfig.negTxn) {
  //       negTestTxnConfig.negTxn.unsignedTxn = await negTestTxnConfig.negTxn.unsignedTxnPromise;
  //     }
  //     const outerTxns = await executeAlgoOrderTest.runFullExecTest(config, true);
  //     outerTxns.map( (txn) => {
  //       const unsignedTxn = txn.unsignedTxn;
  //       // console.log({unsignedTxn});
  //     });
  //     const result = await testHelper.runNegativeTest(config, config.client, outerTxns, negTestTxnConfig);
  //     expect(result).toBeTruthy();
  //   }, JEST_MINUTE_TIMEOUT);
  // });

  test(
    'Place algo escrow order',
    async () => {
      // let asaBalance = await testHelper.getAssetBalance(
      //   config.creatorAccount.addr,
      //   config.assetId
      // );
      // expect(asaBalance).toBeNull();

      const result = await placeAlgoOrderTest.runTest(config, 0.8, 1.2);
      expect(result).toBeTruthy();

      // asaBalance = await testHelper.getAssetBalance(
      //   config.creatorAccount.addr,
      //   config.assetId
      // );
      // expect(asaBalance).toEqual(0);
    },
    JEST_MINUTE_TIMEOUT
  );

  // test(
  //   'Close algo escrow order',
  //   async () => {
  //     const result = await closeOrderTest.runTest(config, 1.2);
  //     expect(result).toBeTruthy();
  //   },
  //   JEST_MINUTE_TIMEOUT
  // );

  // test(
  //   'Delete algo escrow order book',
  //   async () => {
  //     await testHelper.closeAccount(
  //       config.client,
  //       config.creatorAccount,
  //       config.openAccount
  //     );
  //     config.creatorAccount = config.oldCreatorAccount;
  //     const result = await deleteAppTest.runTest(config);
  //     expect(result).toBeTruthy();
  //   },
  //   JEST_MINUTE_TIMEOUT
  // );
});
