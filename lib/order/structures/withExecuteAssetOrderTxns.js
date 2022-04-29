const makeTakerAssetTxns = require('../txns/makeTakerAssetTxns');
/**
 * ## ✉ withExecuteAssetOrderTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:order/structures
 */
function withExecuteAssetOrderTxns(order) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: makeTakerAssetTxns(order, order.isExistingEscrow, !order.skipASAOptIn),
    },
  };
}

module.exports = withExecuteAssetOrderTxns;

