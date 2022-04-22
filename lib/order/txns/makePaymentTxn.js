/** @module order/txns */
const teal = require('../../teal');

/**
 * order.makePaymentTxn
 *
 * @param {Order} order
 * @param {Uint8Array} note
 * @param {boolean} shouldClose
 * @return {Promise<Transaction>}
 */
function makePaymentTxn(order, note, shouldClose) {
  return teal.txns.makePaymentTxn(
      order.client,
      order.contract.from,
      order.contract.to,
      order.contract.amount,
      undefined,
      note,
      order.contract.params,
      undefined,
      shouldClose,
  );
}


module.exports = makePaymentTxn;
