const makePlaceAlgoTxns = require('../txns/makePlaceAlgoTxns');
/**
 * ## ✉ withPlaceAlgoOrderTxns
 *
 * Add the outer transactions for an Algo order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:order/structures
 */
function withPlaceAlgoOrderTxns(order) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: makePlaceAlgoTxns(order, order.isExistingEscrow, !order.skipASAOptIn),
    },
  };
}

module.exports = withPlaceAlgoOrderTxns;
