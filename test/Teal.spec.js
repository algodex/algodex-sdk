

// const testHelper = require('../test_helper.js');
// const transactionGenerator = require('../generate_transaction_types.js');
// const createAppTest = require('./teal_tests/createAppTest.js');
// const deleteAppTest = require('./teal_tests/deleteAppTest.js');
// const placeOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
// const executeAlgoOrderTest = require('./teal_tests/executeAlgoEscrowOrder.js');
// const executeAsaOrderTest = require('./teal_tests/executeASAEscrowOrder.js');
// const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
// const closeOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
// const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');


// const AlgodexApi = require('../algodex_api.js');
// const constants = require('../constants.js');
// const JEST_MINUTE_TIMEOUT = 60 * 1000;

// config = {
//   appId: -1,
//   creatorAccount: testHelper.getRandomAccount(),
//   executorAccount: testHelper.getRandomAccount(),
//   openAccount: testHelper.getOpenAccount(),
//   maliciousAccount: testHelper.getRandomAccount(),
//   client: testHelper.getLocalClient(),
//   assetId: 66711302,
// };

// console.log("DEBUG_SMART_CONTRACT_SOURCE is: " + constants.DEBUG_SMART_CONTRACT_SOURCE);


// describe('ALGO ESCROW ORDER BOOK (opt in test)', () => {
//   test('Create algo escrow order book', async () => {
//     config.appId = await createAppTest.runTest(config, true);
//     global.ALGO_ESCROW_APP_ID = config.appId;
//     expect (config.appId).toBeGreaterThan(0);

//     config.oldCreatorAccount = config.creatorAccount;
//     // make a new creatorAccount that hasn't been opted into any ASA
//     config.creatorAccount = testHelper.getRandomAccount();
//     testHelper.transferFunds(config.client, config.openAccount, config.creatorAccount, 2000000);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - wrong extra transaction ', async () => {
//     const result = await placeOrderTest.runGroupSizeWrongTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - wrong extra transaction (part 2)', async () => {
//     const result = await placeOrderTest.runGroupSizeWrongTest2(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - pay amount too low test', async () => {
//     const result = await placeOrderTest.runPayAmountTooLowTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - pay not to lsig test', async () => {
//     const result = await placeOrderTest.runPayNotToLsigTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);


//   test ('Place algo escrow order', async () => {
//     let asaBalance = await testHelper.getAssetBalance(config.creatorAccount.addr, config.assetId);
//     expect (asaBalance).toBeNull();

//     const result = await placeOrderTest.runTest(config, 800000, 1.2);
//     expect (result).toBeTruthy();

//     asaBalance = await testHelper.getAssetBalance(config.creatorAccount.addr, config.assetId);
//     expect (asaBalance).toEqual(0);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - wrong extra transaction ', async () => {
//     const result = await closeOrderTest.runGroupSizeWrongTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - wrong extra transaction (part 2)', async () => {
//     const result = await closeOrderTest.runGroupSizeWrongTest2(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - runAlgoWrongAddrCloseToTest', async () => {
//     const result = await closeOrderTest.runAlgoWrongAddrCloseToTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - runCloseToTxnHasNonZeroAmount', async () => {
//     const result = await closeOrderTest.runCloseToTxnHasNonZeroAmount(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - runAlgoWrongOwnerProofTest', async () => {
//     const result = await closeOrderTest.runAlgoWrongOwnerProofTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - appCallMissing', async () => {
//     const result = await closeOrderTest.appCallMissing(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - payTxnWrongType', async () => {
//     const result = await closeOrderTest.payTxnWrongType(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Cancel order - refundTxnWrongType', async () => {
//     const result = await closeOrderTest.refundTxnWrongType(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   ////////////////////////////////////////
//   // FULL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////
//   test ('Asset amount too small', async () => {
//     const result = await executeAlgoOrderTest.runAssetAmtTooSmallTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Wrong group size', async () => {
//     const result = await executeAlgoOrderTest.runGroupSizeWrongTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Wrong group size - #2', async () => {
//     const result = await executeAlgoOrderTest.runGroupSizeWrongTest2(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('App call missing', async () => {
//     const result = await executeAlgoOrderTest.appCallMissing(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Algo amount too large', async () => {
//     const result = await executeAlgoOrderTest.runAlgoAmtTooLargeTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  
  
//   test ('Algo amount to wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAlgoAmtWrongAddrTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Algo closeout to wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAlgoWrongAddrCloseToTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('ASA transfer to wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAsaAmtWrongAddrTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Algo payment from wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAlgoPayFromWrongAddrTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Algo payment has closeout to non-owner', async () => {
//     const result = await executeAlgoOrderTest.runAlgoCloseoutToWrongOwnerTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('ASA transfer has closeout', async () => {
//     const result = await executeAlgoOrderTest.runASATransferHasCloseoutTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   ////////////////////////////////////////////////
//   // END FULL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////////////

//   ////////////////////////////////////////////////
//   // PARTIAL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////////////
//   test ('Asset amount too small', async () => {
//     const result = await executeAlgoOrderTest.runAssetAmtTooSmallTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Wrong group size', async () => {
//     const result = await executeAlgoOrderTest.runGroupSizeWrongTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Wrong group size - #2', async () => {
//     const result = await executeAlgoOrderTest.runGroupSizeWrongTest2(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('App call missing', async () => {
//     const result = await executeAlgoOrderTest.appCallMissing(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Algo amount too large', async () => {
//     const result = await executeAlgoOrderTest.runAlgoAmtTooLargeTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  
  
//   test ('Algo amount to wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAlgoAmtWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Algo closeout to wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAlgoWrongAddrCloseToTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('ASA transfer to wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAsaAmtWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Algo payment from wrong address', async () => {
//     const result = await executeAlgoOrderTest.runAlgoPayFromWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Algo payment has closeout to non-owner', async () => {
//     const result = await executeAlgoOrderTest.runAlgoCloseoutToWrongOwnerTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('ASA transfer has closeout', async () => {
//     const result = await executeAlgoOrderTest.runASATransferHasCloseoutTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Fee refund is going to the wrong address', async () => {
//     const result = await executeAlgoOrderTest.runFeeToWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Fee refund is too low', async () => {
//     const result = await executeAlgoOrderTest.runLowFeeTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  

//   test ('Fee refund originates from lsig maliciously', async () => {
//     const result = await executeAlgoOrderTest.runFeeFromWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);  


//   ////////////////////////////////////////////////
//   // END PARTIAL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////////////

//   test ('Close algo escrow order', async () => {
//     const result = await closeOrderTest.runTest(config, 1.2);
//     expect (result).toBeTruthy();
//     await testHelper.closeAccount(config.client, config.creatorAccount, config.openAccount);
//     config.creatorAccount = config.oldCreatorAccount;
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Delete algo escrow order book', async () => {
//       config.creatorAccount = config.oldCreatorAccount;
//       const result = await deleteAppTest.runTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

// });

// describe('ALGO ESCROW ORDER BOOK', () => {
//   test('Create algo escrow order book', async () => {
//     config.appId = await createAppTest.runTest(config, true);
//     global.ALGO_ESCROW_APP_ID = config.appId;
//     expect (config.appId).toBeGreaterThan(0);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - wrong extra transaction (skip asa opt-in)', async () => {
//     const result = await placeOrderTest.runGroupSizeWrongTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - wrong extra transaction (part 2)  (skip asa opt-in)', async () => {
//     const result = await placeOrderTest.runGroupSizeWrongTest2(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - pay amount too low test  (skip asa opt-in)', async () => {
//     const result = await placeOrderTest.runPayAmountTooLowTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place order - pay not to lsig test  (skip asa opt-in)', async () => {
//     const result = await placeOrderTest.runPayNotToLsigTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place algo escrow order', async () => {
//     const result = await placeOrderTest.runTest(config, 800000, 1.2);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Partially execute algo escrow order', async () => {
//     const result = await executeAlgoOrderTest.runPartialExecTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Fully execute algo escrow order', async () => {
//     const result = await executeAlgoOrderTest.runFullExecTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place algo escrow order with skip ASA opt-in', async () => {
//     const result = await placeOrderTest.runTest(config, 830000, 1.35, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close algo escrow order', async () => {
//     const result = await closeOrderTest.runTest(config, 1.35);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Delete algo escrow order book', async () => {
//       const result = await deleteAppTest.runTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

// });

// describe('ASA ESCROW ORDER BOOK', () => {

//   test ('Create asa escrow order book', async () => {
//       config.creatorAccount = testHelper.getRandomAccount();
//       config.executorAccount = testHelper.getRandomAccount();
//       config.maliciousAccount = testHelper.getRandomAccount();
//       config.appId = await createAppTest.runTest(config, false);
//       global.ASA_ESCROW_APP_ID = config.appId;
//       expect (config.appId).toBeGreaterThan(0);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runGroupSizeWrongTest2', async () => {
//     const result = await placeASAOrderTest.runGroupSizeWrongTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runGroupSizeWrongTest', async () => {
//     const result = await placeASAOrderTest.runGroupSizeWrongTest2(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runPayAmountTooLowTest', async () => {
//     const result = await placeASAOrderTest.runPayAmountTooLowTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runAppOptInMissingTest', async () => {
//     const result = await placeASAOrderTest.runAppOptInMissingTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runAssetIdWrongTest', async () => {
//     const result = await placeASAOrderTest.runAssetIdWrongTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runAssetAmountZeroTest', async () => {
//     const result = await placeASAOrderTest.runAssetAmountZeroTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place ASA escrow - runAssetRecipientWrongTest', async () => {
//     const result = await placeASAOrderTest.runAssetRecipientWrongTest(config);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place asa escrow order', async () => {
//       const asaAmount = 400000;
//       const price = 1.25;
//       const result = await placeASAOrderTest.runTest(config, asaAmount, price);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Partially execute asa escrow order', async () => {
//     const asaAmountReceiving = 80000;
//     const price = 1.25;

//     const result = await executeAsaOrderTest.runPartialExecTest(config, asaAmountReceiving, price);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   ////////////////////////////////////////
//   // START FULL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////

//   test ('Run asset amount too large test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runAssetAmtTooLargeTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Run algo amount too small test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoAmtTooSmallTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Group size wrong test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runGroupSizeWrongTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Group size wrong test2 (full exec)', async () => {
//     const result = await executeAsaOrderTest.runGroupSizeWrongTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Algo amount to wrong owner test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoAmtWrongAddrTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Unexpected ASA close out test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runASAWrongAddrCloseToTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Wrong app call test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runAppCallWrongAppTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('runAlgoBalanceCloseoutToWrongAddressTest test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoBalanceCloseoutToWrongAddressTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('runAlgoPayAmountNotZeroTest test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoPayAmountNotZeroTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('runWrongTransactionTypeTest test (full exec)', async () => {
//     const result = await executeAsaOrderTest.runWrongTransactionTypeTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   ////////////////////////////////////////
//   // END FULL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////

//   ////////////////////////////////////////
//   // START PARTIAL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////
  
//   test ('Run asset amount too large test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runAssetAmtTooLargeTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Run algo amount too small test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoAmtTooSmallTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Group size wrong test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runGroupSizeWrongTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Group size wrong test2 (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runGroupSizeWrongTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Algo amount to wrong owner test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoAmtWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Unexpected ASA close out test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runASAWrongAddrCloseToTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Fee sent to wrong addr test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runFeeToWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Fee from wrong addr test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runFeeFromWrongAddrTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Fee too small test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runFeeTooSmallTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Wrong app call test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runAppCallWrongAppTest(config, false);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('runAlgoBalanceCloseoutToWrongAddressTest test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runAlgoBalanceCloseoutToWrongAddressTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('runWrongTransactionTypeTest test (partial exec)', async () => {
//     const result = await executeAsaOrderTest.runWrongTransactionTypeTest(config, true);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   ////////////////////////////////////////
//   // END PARTIAL EXECUTION NEGATIVE TEST CASES
//   ////////////////////////////////////////

//  //UNCOMMENT FOR DEV TESTING ONLY FOR NEG CASES 
// //  test ('Close asa escrow order', async () => {
// //       const price = 1.25;
// //       const result = await closeASAOrderTest.runTest(config, price);
// //       expect (result).toBeTruthy();
// //   }, JEST_MINUTE_TIMEOUT);
// // });

//   test ('Fully execute asa escrow order', async () => {
//     const price = 1.25;

//     const result = await executeAsaOrderTest.runFullExecTest(config, price);
//     expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place asa escrow order', async () => {
//       const asaAmount = 725000;
//       const price = 1.45;
//       const result = await placeASAOrderTest.runTest(config, asaAmount, price);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - runGroupSizeWrongTest', async () => {
//       const result = await closeASAOrderTest.runGroupSizeWrongTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);


//   test ('Close asa escrow order - runGroupSizeWrongTest2', async () => {
//       const result = await closeASAOrderTest.runGroupSizeWrongTest2(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);


//   test ('Close asa escrow order - appCallMissing', async () => {
//       const result = await closeASAOrderTest.appCallMissing(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - appCallMissing2', async () => {
//       const result = await closeASAOrderTest.appCallMissing2(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - appCallWrongSender', async () => {
//       const result = await closeASAOrderTest.appCallWrongSender(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - runASAWrongAddrCloseToTest', async () => {
//       const result = await closeASAOrderTest.runASAWrongAddrCloseToTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - runAlgoWrongAddrCloseToTest', async () => {
//       const result = await closeASAOrderTest.runAlgoWrongAddrCloseToTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - runASACloseToTxnHasNonZeroAmount', async () => {
//       const result = await closeASAOrderTest.runASACloseToTxnHasNonZeroAmount(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - runAlgoCloseToTxnHasNonZeroAmount', async () => {
//       const result = await closeASAOrderTest.runAlgoCloseToTxnHasNonZeroAmount(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order - runWrongOwnerProofTest', async () => {
//       const result = await closeASAOrderTest.runWrongOwnerProofTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order', async () => {
//       const price = 1.45;
//       const result = await closeASAOrderTest.runTest(config, price);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Delete asa escrow order book', async () => {
//       const result = await deleteAppTest.runTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

// });


// describe('ASA ESCROW ORDER BOOK (with extra ASA opt-in txn during execution. Partial execution)', () => {

//   test ('Create asa escrow order book and account without optin', async () => {
//       config.creatorAccount = testHelper.getRandomAccount();
//       config.executorAccount = testHelper.getRandomAccount();
//       config.maliciousAccount = testHelper.getRandomAccount();
//       config.appId = await createAppTest.runTest(config, false, false);
//       global.ASA_ESCROW_APP_ID = config.appId;
//       expect (config.appId).toBeGreaterThan(0);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place asa escrow order', async () => {
//       const asaAmount = 735000;
//       const price = 1.55;
//       const result = await placeASAOrderTest.runTest(config, asaAmount, price);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Partially execute asa escrow order (with asa opt-in txn) ', async () => {
//     let asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
//     expect (asaBalance).toBeNull();

//     const asaAmountReceiving = 90000;
//     const price = 1.55;
//     // The execution will cause it to be opted in
//     const result = await executeAsaOrderTest.runPartialExecTest(config, asaAmountReceiving, price);
//     expect (result).toBeTruthy();
    
//     asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
//     expect (asaBalance).toBeGreaterThan(0);
    
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Close asa escrow order', async () => {
//       const price = 1.55;
//       const result = await closeASAOrderTest.runTest(config, price);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Delete asa escrow order book', async () => {
//       const result = await deleteAppTest.runTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

// });

// describe('ASA ESCROW ORDER BOOK (with extra ASA opt-in txn during execution. Full execution)', () => {

//   test ('Create asa escrow order book and account without optin', async () => {
//       config.creatorAccount = testHelper.getRandomAccount();
//       config.executorAccount = testHelper.getRandomAccount();
//       config.maliciousAccount = testHelper.getRandomAccount();
//       // The executorAccount will intentionally *not* be opted into the ASA here
//       config.appId = await createAppTest.runTest(config, false, false);
//       global.ASA_ESCROW_APP_ID = config.appId;
//       expect (config.appId).toBeGreaterThan(0);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Place asa escrow order', async () => {
//       const asaAmount = 735000;
//       const price = 1.55;
//       const result = await placeASAOrderTest.runTest(config, asaAmount, price);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Fully execute asa escrow order (with asa opt-in txn) ', async () => {
//     let asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
//     expect (asaBalance).toBeNull();

//     const price = 1.55;
//     // The execution will cause it to be opted in
//     const result = await executeAsaOrderTest.runFullExecTest(config, price);
//     expect (result).toBeTruthy();

//     asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
//     expect (asaBalance).toBeGreaterThan(0);
//   }, JEST_MINUTE_TIMEOUT);

//   test ('Delete asa escrow order book', async () => {
//       const result = await deleteAppTest.runTest(config);
//       expect (result).toBeTruthy();
//   }, JEST_MINUTE_TIMEOUT);

// });
