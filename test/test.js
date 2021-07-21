

const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');
const createAppTest = require('./teal_tests/createAppTest.js');

appId = -1;
const creatorAccount = testHelper.getRandomAccount();;
const openAccount = testHelper.getOpenAccount();
const client = testHelper.getLocalClient();

config = {
  appId: appId,
  creatorAccount: creatorAccount,
  openAccount: openAccount,
  client: client,
};

const deleteAppTest = async() => {
  console.log("deleting app: " + appId);

  await testHelper.deleteApplication(client, creatorAccount, appId);

  console.log("closing account: " + openAccount.addr + " to " + creatorAccount.addr);
  await testHelper.closeAccount(client, creatorAccount, openAccount);
}

const runTests = async() => {
  appId = await createAppTest.runTest(config);
  config.appId = appId;
  await deleteAppTest();
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
