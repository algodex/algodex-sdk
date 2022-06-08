const makeExecuteAssetTxns = require('./makeExecuteAssetTxns');
/**
 * ## ✉ withExecuteAssetTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @param {boolean} withCloseout
 * @return {Order} The Order with Transaction
 * @memberOf module:txns/sell
 * @private
 */
async function withExecuteAssetTxns(order, withCloseout=false ) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeExecuteAssetTxns(order, withCloseout),
    },
  };
}

module.exports = withExecuteAssetTxns;

