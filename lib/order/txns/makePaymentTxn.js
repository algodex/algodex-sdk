/** @module order/txns */
const algosdk = require('algosdk');
const {isString} = require('lodash/lang');
const logger = require('../../logger');
/**
 * ## Make Payment Transaction
 *
 * Maps a Payment to makePaymentTxnWithSuggestedParams. Used as a part
 * of an Order
 *
 * @param {Order} order Algodex Order
 * @param {boolean} shouldClose Should Close Flag
 * @return {Transaction}
 */
function makePaymentTxn(order, shouldClose) {
  const {amount, from, to, contract: {params}} = order;
  // TODO: Validate Order
  if (!isString(from)) {
    throw new TypeError('Must have valid from!');
  }
  if (!isString(to)) {
    throw new TypeError('Must have valid to!');
  }

  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;
  const enc = new TextEncoder();
  const note = enc.encode('Hello World');
  let closeAddr = undefined;
  if (shouldClose === true) {
    closeAddr = to;
  }
  logger.debug({from, to, amount, closeAddr, note, params});
  return algosdk.makePaymentTxnWithSuggestedParams(
      from, to, amount, closeAddr, note, params,
  );
}

module.exports = makePaymentTxn;
