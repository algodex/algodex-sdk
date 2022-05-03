const makeExecuteAssetTxns = require('../txns/makeExecuteAssetTxns');
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
  const {
    cutTakerOrder: {
      escrowCreator,
      asaAmountReceiving,
      algoAmountSending,
      lsig,
      orderBookEscrowEntry: {
        orderEntry: escrowOrderEntry,
      },
    },
  } = order;

  return await makeExecuteAssetTxns({
    ...order,
    contract: {
      ...order.contract,
      amountSending: algoAmountSending,
      amountReceiving: asaAmountReceiving,
      lsig: lsig,
      creator: escrowCreator,
      entry: escrowOrderEntry,
      // ::** make sure to fix with taker sell side. cutOrder calculates based off the
      // the best price but order.contract.entry is the maker compiled entry which so need to change
      // to escrowOrderEntry
    },

  });
}

module.exports = structureCutAssetTakerTxns;

