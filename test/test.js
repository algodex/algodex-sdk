

const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');


const test1 = async() => {


  const client = testHelper.getLocalClient();
  console.log("starting the test");
  
  let openAccount = testHelper.getOpenAccount();

  let creatorAccount = testHelper.getRandomAccount();

  const fundTxn = await transactionGenerator.getPayTxn(client, openAccount, creatorAccount, 1000000);
  const fundTxnId = fundTxn.txID().toString();

  let signedFundTxn = fundTxn.signTxn(openAccount.sk);
  console.log("Signed transaction with txID: %s", fundTxnId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedFundTxn).do();
  } catch (e) {
    console.log(JSON.stringify(e));
  }

  // Wait for confirmation
  await testHelper.waitForConfirmation(client, fundTxnId);




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
  let appId = transactionResponse['application-index'];
  console.log("Created new app-id: ",appId);


};

test1();




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
