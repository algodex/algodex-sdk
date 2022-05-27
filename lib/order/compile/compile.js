/** @module order/compile **/
const algosdk = require('algosdk');
const withUnits = require('./withUnits');
const withLogicSigAccount = require('./withLogicSigAccount.js');
const withOrderbookEntry = require('./withOrderbookEntry.js');
const logger = require('../../logger');
/**
 * ## 🏗 [Compile Order](#compile)
 *
 * Takes an {@link Order} and compiles it into the required shape for the sdk.
 * This includes converting floats to {@link BaseUnits} with Numerator and
 * Denominator. The {@link BaseUnits} properties are used to compile the
 * delegate template. Then it constructs a {@link LogicSigAccount} which is
 * the main output of the compile step.
 *
 * @example
 * const {order: compile} = require('@algodex/sdk')
 * const order = compile({
 *   "client": new algosdk.Algodv2(),
 *   "asset": {
 *     "id": 15322902,
 *     "decimals": 6,
 *   },
 *   "address": "TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I",
 *   "price": 2.22,
 *   "amount": 1,
 *   "total": 2,
 *   "execution": "maker",
 *   "type": "buy",
 *   "appId": 22045503,
 *   "version": 6
 * })
 * console.log(order.contract.lsig)
 * // Outputs LogicSigAccount
 *
 * @param {Order} o The Order Object
 * @return {Promise<Order>} Returns a composed order with ContractState
 * @memberOf module:order/compile
 */
async function compile( o) {
  logger.debug(`compile(Order) as ${o.execution}`);
  if (!(o?.client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }
  if (typeof o?.asset === 'undefined' || (typeof o?.asset?.decimals !== 'number' && typeof o?.contract?.N === 'undefined')) {
    throw new TypeError('Invalid Asset!!');
  }
  return await withLogicSigAccount(withOrderbookEntry(withUnits(o)));
}

module.exports = compile;
