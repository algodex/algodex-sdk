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
 * @memberOf module:order/structures
 */
async function structureCutAssetTakerTxns(order) { // TODO: change this to withCutAssetTakerTxns


  return await makeExecuteAssetTxns(order);
}

module.exports = structureCutAssetTakerTxns;

