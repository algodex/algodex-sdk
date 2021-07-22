

const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');
const createAppTest = require('./teal_tests/createAppTest.js');
const deleteAppTest = require('./teal_tests/deleteAppTest.js');
const placeOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const closeOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const AlgodexApi = require('../algodex_api.js');


config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  client: testHelper.getLocalClient(),
  assetId: 15322902,
};

const runTests = async() => {
  config.appId = await createAppTest.runTest(config);
  global.ALGO_ESCROW_APP_ID = config.appId;

  //try {
  await placeOrderTest.runTest(config);
  await closeOrderTest.runTest(config);
  //} catch (e) {
    //console.log( e.Error );
  //}

  await deleteAppTest.runTest(config);
};

runTests();


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
