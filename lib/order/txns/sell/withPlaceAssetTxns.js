const makePlaceAssetTxns = require('./makePlaceAssetTxns');
/**
 * ## ✉ withPlaceAssetTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:txns/sell
 * @private
 */
async function withPlaceAssetTxns(order) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: await makePlaceAssetTxns(order, order.isExistingEscrow),
      creator: order.wallet.address,
    },

  };
}

module.exports = withPlaceAssetTxns;

