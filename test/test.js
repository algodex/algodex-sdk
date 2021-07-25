

const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');
const createAppTest = require('./teal_tests/createAppTest.js');
const deleteAppTest = require('./teal_tests/deleteAppTest.js');
const placeOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const closeOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');

//const deleteAppTest = require('./teal_tests/deleteASAAppTest.js');
//const placeOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
//const closeOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');


const AlgodexApi = require('../algodex_api.js');
const constants = require('../constants.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;

config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
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



  //try {

  test ('Place algo escrow order', async () => {
    const result = await placeOrderTest.runTest(config);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Close algo escrow order', async () => {
    const result = await closeOrderTest.runTest(config);
    expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  
  //} catch (e) {
    //console.log( e.Error );
  //}

  test ('Delete algo escrow order book', async () => {
      const result = await deleteAppTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);
  
 // ASA ORDERBOOK TESTS
});

describe('ASA ESCROW ORDER BOOK', () => {

  test ('Create asa escrow order book', async () => {
      config.creatorAccount = testHelper.getRandomAccount();
      config.appId = await createAppTest.runTest(config, false);
      global.ASA_ESCROW_APP_ID = config.appId;
      expect (config.appId).toBeGreaterThan(0);
  }, JEST_MINUTE_TIMEOUT);

  test ('Place asa escrow order', async () => {
      const result = await placeASAOrderTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Close asa escrow order', async () => {
      const result = await closeASAOrderTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

  test ('Delete asa escrow order book', async () => {
      const result = await deleteAppTest.runTest(config);
      expect (result).toBeTruthy();
  }, JEST_MINUTE_TIMEOUT);

});

//};

//runTests();


  // Uncomment for mocha test format
  /*var assert = require('assert');
  describe('Array', function() {
    describe('#indexOf()', function() {
      it('should return -1 when the value is not present', async function() {
        //const algodClient = testHelper.getLocalClient();
        //const createTrans = await transactionGenerator.getCreateAppTxn(algodClient);
        console.log(createTrans.toString());
        assert.equal([1, 2, 3].indexOf(4), -1);
      });
    });
  });
  */
