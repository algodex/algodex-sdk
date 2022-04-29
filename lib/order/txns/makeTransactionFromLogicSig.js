/** @module order/txns */
const _makeTransactionFromLogicSig = require('../../teal/txns/makeTransactionFromLogicSig');

/**
 *
 * @param order
 * @param txnType
 * @param appArgs
 * @return {Promise<Transaction>}
 */
async function makeTransactionFromLogicSig(order, txnType, appArgs) {
  return await _makeTransactionFromLogicSig(
      order.client,
      txnType,
      order.contract.lsig,
      undefined,
      order.appId,
      appArgs,
  );
}

module.exports = makeTransactionFromLogicSig;
