const algosdk = require('algosdk');
const teal = require('../../teal');

/**
 * order.makePaymentTxn
 *
 * @param {Order} order The Order Object
 * @param {string} [closeToRemainder] Close out to account
 * @param {Uint8Array} [note] A encode note for the Transaction

 * @return {Promise<Transaction>}
 * @ignore
 */
async function makePaymentTxn(order, closeToRemainder, note) {
  // TODO: Validate Order
  const _suggestedParams = await teal.getTransactionParams(order.client, order?.contract?.params, true);

  return algosdk.makePaymentTxnWithSuggestedParams(
      order.contract.from,
      order.contract.to,
      order.contract.amount,
      closeToRemainder, // Can we change this back to closeRemainderTo?
      note,
      _suggestedParams,
      undefined,
  );
}


module.exports = makePaymentTxn;
