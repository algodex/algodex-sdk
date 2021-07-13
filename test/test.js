const testHelper = require('../test_helper.js');
const transactionGenerator = require('../generate_transaction_types.js');

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

const algodClient = testHelper.getLocalClient();

console.log("starting the test");