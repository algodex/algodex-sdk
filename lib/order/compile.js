const algosdk = require('algosdk');
const withUnits = require('./compile/withUnits');
const withLogicSigAccount = require('./compile/withLogicSigAccount.js');
const withOrderbookEntry = require('./compile/withOrderbookEntry.js');

/**
 * Compile Teal Order
 *
 * @param {Order} o
 * @return {Promise<Order>}
 */
async function compile( o) {
  if (!(o?.client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }
  return await withLogicSigAccount(withOrderbookEntry(withUnits(o)));
}

module.exports = compile;
