const makeExecuteAssetTxns = require('./makeExecuteAssetTxns');
/**
 * ## ✉ structureCutAssetTakerTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 */
async function withExecuteAssetTxns(order, withCloseout=false ) { // TODO: change this to withCutAssetTakerTxns
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeExecuteAssetTxns(order, withCloseout),
    },
  };
}

module.exports = withExecuteAssetTxns;

