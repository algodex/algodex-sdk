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
const algosdk = require('algosdk');
const testAccount = require('./TestAccount.js');

const AlgodexApi = require('../algodex_api.js');
const constants = require('../constants.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;

config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  maliciousAccount: testHelper.getRandomAccount(),
  client: testHelper.getLocalClient(),
  assetId: 66711302,
};

console.log("DEBUG_SMART_CONTRACT_SOURCE is: " + constants.DEBUG_SMART_CONTRACT_SOURCE);

const textEncoder = new TextEncoder();

