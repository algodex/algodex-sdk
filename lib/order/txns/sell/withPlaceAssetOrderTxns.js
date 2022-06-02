const makePlaceAssetTxns = require('./makePlaceAssetTxns');
/**
 * ## ✉ withPlaceAssetOrderTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:txns/sell
 */
async function withPlaceAssetOrderTxns(order) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: await makePlaceAssetTxns(order, order.isExistingEscrow),
    },

  };
}

module.exports = withPlaceAssetOrderTxns;

