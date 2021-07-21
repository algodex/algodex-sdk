

const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');

let appId = -1;
let creatorAccount = testHelper.getRandomAccount();;
let openAccount = testHelper.getOpenAccount();
const client = testHelper.getLocalClient();

const createAppTest = async() => {
  console.log("starting the test");

  await testHelper.transferFunds(client, openAccount, creatorAccount, 300000);
  
  const createTxn = await transactionGenerator.getCreateAppTxn(client, creatorAccount);
  let txId = createTxn.txID().toString();
  console.log("txID: " + txId);

    // Sign the transaction

  let signedTxn = createTxn.signTxn(creatorAccount.sk);
  console.log("Signed transaction with txID: %s", txId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedTxn).do();
  } catch (e) {
    console.log(JSON.stringify(e));
  }

  // Wait for confirmation
  await testHelper.waitForConfirmation(client, txId);

  // display results
  let transactionResponse = await client.pendingTransactionInformation(txId).do();
  appId = transactionResponse['application-index'];
  console.log("Created new app-id: ",appId);

  let accountInfo = await testHelper.getAccountInfo(creatorAccount.addr);
  console.log( "amount: " , accountInfo.amount );


};

const deleteAppTest = async() => {
  console.log("deleting app: " + appId);

  await testHelper.deleteApplication(client, creatorAccount, appId);

  console.log("closing account: " + openAccount.addr + " to " + creatorAccount.addr);
  await testHelper.closeAccount(client, creatorAccount, openAccount);
}

const runTests = async() => {
  await createAppTest();
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
