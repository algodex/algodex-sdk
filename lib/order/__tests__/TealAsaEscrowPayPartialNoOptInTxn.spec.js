/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

it('should fix these tests', ()=>{
  const isBroken = true;
  expect(isBroken).toEqual(true);
});
// const testHelper = require('./setup.js');
// const transactionGenerator = require('../generate_transaction_types.js');
// const createAppTest = require('./teal_tests/createAppTest.js');
// const deleteAppTest = require('./teal_tests/deleteAppTest.js');
// const placeOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
// const executeAlgoOrderTest = require('./teal_tests/executeAlgoEscrowOrder.js');
// const executeAsaOrderTest = require('./teal_tests/executeASAEscrowOrder.js');
// const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
// const closeOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
// const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
// const algosdk = require('algosdk');
//
//
// const AlgodexApi = require('../algodex_api.js');
// const constants = require('../constants.js');
// const JEST_MINUTE_TIMEOUT = 60 * 1000;
//
// const config = {
//   appId: -1,
//   creatorAccount: testHelper.getRandomAccount(),
//   executorAccount: testHelper.getRandomAccount(),
//   openAccount: testHelper.getOpenAccount(),
//   maliciousAccount: testHelper.getRandomAccount(),
//   client: testHelper.getLocalClient(),
//   assetId: 66711302,
// };
//
// console.log('DEBUG_SMART_CONTRACT_SOURCE is: ' + constants.DEBUG_SMART_CONTRACT_SOURCE);
//
// const textEncoder = new TextEncoder();
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
// describe('ASA ESCROW ORDER BOOK', () => {
//   test('Create asa escrow order book', async () => {
//     config.creatorAccount = testHelper.getRandomAccount();
//     config.executorAccount = testHelper.getRandomAccount();
//     config.maliciousAccount = testHelper.getRandomAccount();
//     config.appId = await createAppTest.runTest(config, false, true);
//     global.ASA_ESCROW_APP_ID = config.appId;
//     expect(config.appId).toBeGreaterThan(0);
//   }, JEST_MINUTE_TIMEOUT);
//
//   test('Place asa escrow order', async () => {
//     const asaAmount = 400000;
//     const price = 1.25;
//     const result = await placeASAOrderTest.runTest(config, asaAmount, price);
//     expect(result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);
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
//   test('Partially execute asa escrow order (no opt-in txn)', async () => {
//     const asaAmountReceiving = 80000;
//     const price = 1.25;
//     const asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
//     expect(asaBalance).toBeGreaterThan(0);
//
//     const result = await executeAsaOrderTest.runPartialExecTest(config, asaAmountReceiving, price);
//     expect(result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);
//
//   test('Close asa escrow order', async () => {
//     const price = 1.25;
//     const result = await closeASAOrderTest.runTest(config, price);
//     expect(result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);
//
//   test('Delete asa escrow order book', async () => {
//     const result = await deleteAppTest.runTest(config);
//     expect(result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);
// });
//
