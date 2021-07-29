

const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');
const createAppTest = require('./teal_tests/createAppTest.js');
const deleteAppTest = require('./teal_tests/deleteAppTest.js');
const placeOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const executeAlgoOrderTest = require('./teal_tests/executeAlgoEscrowOrder.js');
const executeAsaOrderTest = require('./teal_tests/executeASAEscrowOrder.js');
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const closeOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');


const AlgodexApi = require('../algodex_api.js');
const constants = require('../constants.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;

config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  client: testHelper.getLocalClient(),
  assetId: 15322902,
};

//const runTests = async() => {
console.log("DEBUG_SMART_CONTRACT_SOURCE is: " + constants.DEBUG_SMART_CONTRACT_SOURCE);


describe('ALGO ESCROW ORDER BOOK', () => {
  // ALGO ORDERBOOK TESTS
  test('Create algo escrow order book', async () => {
    config.appId = await createAppTest.runTest(config, true);
    global.ALGO_ESCROW_APP_ID = config.appId;
    expect (config.appId).toBeGreaterThan(0);
  }, JEST_MINUTE_TIMEOUT);

  test ('Place algo escrow order', async () => {
    const result = await placeOrderTest.runTest(config, 800000, 1.2);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Partially execute algo escrow order', async () => {
    const result = await executeAlgoOrderTest.runPartialExecTest(config);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Fully execute algo escrow order', async () => {
    const result = await executeAlgoOrderTest.runFullExecTest(config);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Place algo escrow order', async () => {
    const result = await placeOrderTest.runTest(config, 830000, 1.35);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Close algo escrow order', async () => {
    const result = await closeOrderTest.runTest(config, 1.35);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Delete algo escrow order book', async () => {
      const result = await deleteAppTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);
 // ASA ORDERBOOK TESTS

});

describe('ASA ESCROW ORDER BOOK', () => {

  test ('Create asa escrow order book', async () => {
      config.creatorAccount = testHelper.getRandomAccount();
      config.executorAccount = testHelper.getRandomAccount();
      config.appId = await createAppTest.runTest(config, false);
      global.ASA_ESCROW_APP_ID = config.appId;
      expect (config.appId).toBeGreaterThan(0);
  }, JEST_MINUTE_TIMEOUT);

  test ('Place asa escrow order', async () => {
      const asaAmount = 400000;
      const price = 1.25;
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Partially execute asa escrow order', async () => {
    const asaAmountReceiving = 80000;
    const price = 1.25;

    const result = await executeAsaOrderTest.runPartialExecutionTest(config, asaAmountReceiving, price);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Fully execute asa escrow order', async () => {
    const price = 1.25;

    const result = await executeAsaOrderTest.runFullExecutionTest(config, price);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Place asa escrow order', async () => {
      const asaAmount = 725000;
      const price = 1.45;
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Close asa escrow order', async () => {
      const price = 1.45;
      const result = await closeASAOrderTest.runTest(config, price);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Delete asa escrow order book', async () => {
      const result = await deleteAppTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

});

describe('ASA ESCROW ORDER BOOK WITHOUT OPT-IN (PARTIAL EXECUTION)', () => {

  test ('Create asa escrow order book and account without optin', async () => {
      config.creatorAccount = testHelper.getRandomAccount();
      config.executorAccount = testHelper.getRandomAccount();
      config.appId = await createAppTest.runTest(config, false, false);
      global.ASA_ESCROW_APP_ID = config.appId;
      expect (config.appId).toBeGreaterThan(0);
  }, JEST_MINUTE_TIMEOUT);

  test ('Place asa escrow order', async () => {
      const asaAmount = 735000;
      const price = 1.55;
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Partially execute asa escrow order', async () => {
    let asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
    expect (asaBalance).toBeNull();

    const asaAmountReceiving = 90000;
    const price = 1.55;
    // The execution will cause it to be opted in
    const result = await executeAsaOrderTest.runPartialExecutionTest(config, asaAmountReceiving, price);
    expect (result).toBeTruthy();
    
    asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
    expect (asaBalance).toBeGreaterThan(0);
    
  }, JEST_MINUTE_TIMEOUT);

  test ('Close asa escrow order', async () => {
      const price = 1.55;
      const result = await closeASAOrderTest.runTest(config, price);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Delete asa escrow order book', async () => {
      const result = await deleteAppTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

});

describe('ASA ESCROW ORDER BOOK WITHOUT OPT-IN (FULL EXECUTION)', () => {

  test ('Create asa escrow order book and account without optin', async () => {
      config.creatorAccount = testHelper.getRandomAccount();
      config.executorAccount = testHelper.getRandomAccount();
      // The executorAccount will intentionally *not* be opted into the ASA here
      config.appId = await createAppTest.runTest(config, false, false);
      global.ASA_ESCROW_APP_ID = config.appId;
      expect (config.appId).toBeGreaterThan(0);
  }, JEST_MINUTE_TIMEOUT);

  test ('Place asa escrow order', async () => {
      const asaAmount = 735000;
      const price = 1.55;
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Fully execute asa escrow order', async () => {
    let asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
    expect (asaBalance).toBeNull();

    const price = 1.55;
    // The execution will cause it to be opted in
    const result = await executeAsaOrderTest.runFullExecutionTest(config, price);
    expect (result).toBeTruthy();

    asaBalance = await testHelper.getAssetBalance(config.executorAccount.addr, config.assetId);
    expect (asaBalance).toBeGreaterThan(0);
  }, JEST_MINUTE_TIMEOUT);

  test ('Delete asa escrow order book', async () => {
      const result = await deleteAppTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

});