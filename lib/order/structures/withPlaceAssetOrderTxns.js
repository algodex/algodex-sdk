const makePlaceAssetTxns = require('../txns/makePlaceAssetTxns');
/**
 * ## ✉ withPlaceAssetOrderTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:order/structures
 */
function withPlaceAssetOrderTxns(order) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: makePlaceAssetTxns(order, order.isExistingEscrow, !order.skipASAOptIn),
    },
  };
}

module.exports = withPlaceAssetOrderTxns;

