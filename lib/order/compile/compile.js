/** @module order/compile **/
const algosdk = require('algosdk');
const withUnits = require('./withUnits');
const withLogicSigAccount = require('./withLogicSigAccount.js');
const withOrderbookEntry = require('./withOrderbookEntry.js');

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
